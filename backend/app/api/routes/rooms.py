from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.models import Campaign, Room
from app.schemas.domain import RoomCreate, RoomRead


router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    session: Session = Depends(get_session),
) -> RoomRead:
    room = Room(dept_code=payload.dept_code, campaign_id=payload.campaign_id)
    session.add(room)
    session.commit()
    session.refresh(room)
    return room


@router.get("/{room_token}", response_model=RoomRead)
def get_room(
    room_token: str,
    session: Session = Depends(get_session),
) -> RoomRead:
    room = session.get(Room, room_token)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    # Optionally validate campaign exists
    if room.campaign_id:
        campaign = session.get(Campaign, room.campaign_id)
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found for room")
    return room
