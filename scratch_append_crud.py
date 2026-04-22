import sys
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

code = """

# =============================================================================
# LINKING REQUESTS
# =============================================================================

def create_linking_request(db: Session, request_data: dict) -> 'LinkingRequest':
    \"\"\"Create a student-initiated linking request.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy import and_
    db.query(LinkingRequest).filter(
        and_(
            LinkingRequest.user_id == request_data["user_id"],
            LinkingRequest.status == \"pending\"
        )
    ).update({\"status\": \"cancelled\"})
    
    request = LinkingRequest(**request_data)
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def get_linking_requests(db: Session, status: str = None):
    \"\"\"Get all linking requests, optionally filtered by status.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy.orm import joinedload
    from sqlalchemy import desc
    query = db.query(LinkingRequest).options(joinedload(LinkingRequest.user))
    if status:
        query = query.filter(LinkingRequest.status == status)
    return query.order_by(desc(LinkingRequest.created_at)).all()

def get_linking_request_by_id(db: Session, request_id: uuid.UUID):
    \"\"\"Get a linking request by UUID.\"\"\"
    from src.database.models import LinkingRequest
    return db.query(LinkingRequest).filter(LinkingRequest.request_id == request_id).first()

def get_user_pending_linking_request(db: Session, user_id: uuid.UUID):
    \"\"\"Get a pending linking request for a specific user.\"\"\"
    from src.database.models import LinkingRequest
    from sqlalchemy import and_
    return db.query(LinkingRequest).filter(
        and_(
            LinkingRequest.user_id == user_id,
            LinkingRequest.status == \"pending\"
        )
    ).first()
\"\"\"

with open('src/database/crud.py', 'a') as f:
    f.write(code)
