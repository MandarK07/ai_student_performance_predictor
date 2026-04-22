import argparse
import sys
from pathlib import Path
from collections import defaultdict

from sqlalchemy.orm import joinedload

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.database.connection import SessionLocal
from src.database import crud
from src.database.models import User


def _unique_emails(student, users):
    emails = []
    if student.email:
        emails.append(student.email)
    for user in users:
        if user.email:
            emails.append(user.email)

    seen = set()
    ordered = []
    for email in emails:
        normalized = email.strip().lower()
        if normalized and normalized not in seen:
            seen.add(normalized)
            ordered.append(email)
    return ordered


def main():
    parser = argparse.ArgumentParser(
        description="Repair student users linked to placeholder student records by merging them into a real student record."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply merges. Without this flag the script only reports what it would do.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .options(joinedload(User.student))
            .filter(User.role == "student", User.student_id.isnot(None))
            .all()
        )

        grouped = defaultdict(list)
        for user in users:
            if user.student_id:
                grouped[str(user.student_id)].append(user)

        merge_candidates = []
        manual_review = []

        for linked_users in grouped.values():
            student = linked_users[0].student
            if not student:
                manual_review.append(
                    {
                        "student_id": None,
                        "student_code": None,
                        "reason": "Linked student record no longer exists",
                        "emails": [user.email for user in linked_users],
                    }
                )
                continue

            if not crud.is_placeholder_student(db, student):
                continue

            target = None
            resolution_error = None
            for email in _unique_emails(student, linked_users):
                target, resolution_error, _matched_by = crud.find_existing_student_for_link(
                    db,
                    email=email,
                    student_code=student.student_code,
                    exclude_student_id=student.student_id,
                )
                if target:
                    break

            if not target:
                manual_review.append(
                    {
                        "student_id": str(student.student_id),
                        "student_code": student.student_code,
                        "reason": resolution_error or "No matching target student found",
                        "emails": _unique_emails(student, linked_users),
                    }
                )
                continue

            conflict = crud.get_student_merge_conflict(db, student, target)
            if conflict:
                manual_review.append(
                    {
                        "student_id": str(student.student_id),
                        "student_code": student.student_code,
                        "target_student_code": target.student_code,
                        "reason": conflict,
                        "emails": _unique_emails(student, linked_users),
                    }
                )
                continue

            merge_candidates.append(
                {
                    "source_student": student,
                    "target_student": target,
                    "user_emails": _unique_emails(student, linked_users),
                }
            )

        print(f"Scanned {len(grouped)} linked student account(s)")
        print(f"Safe merge candidates: {len(merge_candidates)}")
        print(f"Manual review items: {len(manual_review)}")

        for candidate in merge_candidates:
            source = candidate["source_student"]
            target = candidate["target_student"]
            print(
                f"[MERGE {'APPLY' if args.apply else 'DRY-RUN'}] "
                f"{source.student_code} ({source.email}) -> {target.student_code} ({target.email})"
            )
            print(f"  linked user emails: {', '.join(candidate['user_emails'])}")
            if args.apply:
                result = crud.merge_student_records(db, source, target)
                print(f"  moved users={result['moved_users']} predictions={result['moved_predictions']} parents={result['moved_parents']} enrollments={result['moved_enrollments']}")

        if manual_review:
            print("\nManual review required:")
            for item in manual_review:
                print(
                    f"- student_code={item.get('student_code')} student_id={item.get('student_id')} reason={item['reason']}"
                )
                emails = item.get("emails") or []
                if emails:
                    print(f"  emails: {', '.join(emails)}")
                if item.get("target_student_code"):
                    print(f"  candidate target: {item['target_student_code']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
