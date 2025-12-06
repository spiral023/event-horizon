from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.core.database import get_session
from app.models import EventOption
from app.schemas.domain import EventOptionRead


router = APIRouter(prefix="/event-options", tags=["events"])


@router.get("", response_model=List[EventOptionRead])
def list_event_options(
    region: Optional[str] = Query(None, description="Region code filter"),
    session: Session = Depends(get_session),
) -> List[EventOptionRead]:
    stmt = select(EventOption)
    if region:
        stmt = stmt.where(EventOption.location_region == region)
    return list(session.exec(stmt).all())
