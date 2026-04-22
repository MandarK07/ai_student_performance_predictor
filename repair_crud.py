import sys

with open('src/database/crud.py', 'r') as f:
    lines = f.readlines()

# Trim the broken part (from line 845 onwards)
good_lines = lines[:844]

additional_code = """
# =============================================================================
# LINKING REQUESTS
# =============================================================================

def create_linking_request(db, request_data):
    \"\"\"Create a student-initiated linking request.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy import and_
    
    # Cancel any existing pending requests for this user
    db.query(LinkingRequest).filter(
        and_(
            LinkingRequest.user_id == request_data["user_id"],
            LinkingRequest.status == "pending"
        )
    ).update({"status": "cancelled"})
    
    request = LinkingRequest(**request_data)
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def get_linking_requests(db, status=None):
    \"\"\"Get all linking requests, optionally filtered by status.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy.orm import joinedload
    from sqlalchemy import desc
    query = db.query(LinkingRequest).options(joinedload(LinkingRequest.user))
    if status:
        query = query.filter(LinkingRequest.status == status)
    return query.order_by(desc(LinkingRequest.created_at)).all()

def get_linking_request_by_id(db, request_id):
    \"\"\"Get a linking request by UUID.\"\"\"
    from src.database.models import LinkingRequest
    return db.query(LinkingRequest).filter(LinkingRequest.request_id == request_id).first()

def get_user_pending_linking_request(db, user_id):
    \"\"\"Get a pending linking request for a specific user.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy import and_
    return db.query(LinkingRequest).filter(
        and_(
            LinkingRequest.user_id == user_id,
            LinkingRequest.status == "pending"
        )
    ).first()
"""

with open('src/database/crud.py', 'w') as f:
    f.writelines(good_lines)
    f.write(additional_code)
