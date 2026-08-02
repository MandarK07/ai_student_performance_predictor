"""Demo sandbox: dedicated PostgreSQL schema isolation + lifecycle."""
import os, time
from contextvars import ContextVar
from datetime import datetime
from sqlalchemy import text
from src.core.config import settings

_demo_scope = ContextVar("demo_request_scope", default=False)
DEMO_USERNAMES = frozenset({"teacher_demo", "student_demo"})


def set_demo_scope(flag: bool):
    _demo_scope.set(flag)


def request_is_demo() -> bool:
    return _demo_scope.get()


def is_demo_username(identifier: str) -> bool:
    return identifier.strip().lower() in DEMO_USERNAMES


def decommission_legacy_demo_users(db) -> int:
    """Disable legacy public demo accounts; they can never reach production data."""
    from src.database import crud
    from src.database.models import AuthSession
    count = 0
    for username in DEMO_USERNAMES:
        user = crud.get_user_by_username(db, username)
        if user is None:
            continue
        user.is_demo = True
        user.is_active = False
        user.password_changed_at = datetime.utcnow()
        # Revoke all active sessions in the SAME transaction that deactivates the
        # user, so the User + AuthSession rows stay consistent. Using one commit
        # avoids the internal-commit helper that would expire the `user` instance
        # mid-update (leaving it stale/detached).
        now = datetime.utcnow()
        db.query(AuthSession).filter(
            AuthSession.user_id == user.user_id,
            AuthSession.revoked_at.is_(None)
        ).update(
            {"revoked_at": now, "revoke_reason": "demo_sandbox_decommission"},
            synchronize_session=False,
        )
        db.commit()
        # Requery the committed row within this same session so subsequent use
        # does not rely on lazy-loading an expired instance.
        db.refresh(user)
        count += 1
    return count


def _open_demo_session():
    from src.database.connection import DemoSessionLocal
    s = DemoSessionLocal()
    s.execute(text(f'SET search_path TO "{settings.DEMO_SCHEMA}"'))
    s.commit()
    return s


def _reset_due() -> bool:
    marker = settings.DEMO_RESET_MARKER
    if not os.path.exists(marker):
        return True
    try:
        age = (time.time() - os.path.getmtime(marker)) / 60.0
    except OSError:
        return True
    return age >= settings.DEMO_RESET_INTERVAL_MINUTES


def _write_marker():
    os.makedirs(settings.DEMO_UPLOAD_DIR, exist_ok=True)
    with open(settings.DEMO_RESET_MARKER, "w", encoding="utf-8") as fh:
        fh.write(datetime.utcnow().isoformat())


def ensure_demo_ready():
    """Create demo schema, reseed on interval expiry, and repair credentials each boot."""
    from src.database.connection import init_demo_schema, init_demo_tables
    from src.scripts.demo_seed import seed_demo_data
    os.makedirs(settings.DEMO_UPLOAD_DIR, exist_ok=True)
    init_demo_schema()
    reset = _reset_due()
    db = _open_demo_session()
    try:
        if reset:
            init_demo_tables(db)
        # Seed/upsert runs every boot: it is idempotent and repairs demo
        # credentials/status immediately (e.g. after a password change).
        seed_demo_data(db)
    finally:
        db.close()
    if reset:
        _write_marker()
        print("INFO: Demo sandbox seeded")


def reset_demo_schema(db):
    """Drop + recreate the demo schema and reseed."""
    from src.database.connection import init_demo_schema
    from src.scripts.demo_seed import seed_demo_data
    db.execute(text(f'DROP SCHEMA IF EXISTS "{settings.DEMO_SCHEMA}" CASCADE'))
    db.commit()
    init_demo_schema()
    demo_db = _open_demo_session()
    try:
        seed_demo_data(demo_db)
    finally:
        demo_db.close()
    _write_marker()
    print("INFO: Demo sandbox reset complete")