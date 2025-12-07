from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def gen_id() -> str:
    return uuid4().hex


class Department(SQLModel, table=True):
    dept_code: str = Field(primary_key=True, index=True)
    name: Optional[str] = None
    region: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class CampaignStatus(str, Enum):
    voting = "voting"
    funding = "funding"
    booked = "booked"


class Campaign(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    name: str
    dept_code: str = Field(foreign_key="department.dept_code", index=True)
    target_date_range: str
    status: CampaignStatus = Field(default=CampaignStatus.voting)
    total_budget_needed: float
    company_budget_available: float
    budget_per_participant: Optional[float] = None
    external_sponsors: float = 0
    winning_event_id: Optional[str] = Field(default=None, foreign_key="event_options.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class EventCategory(str, Enum):
    action = "Action"
    food = "Food"
    relax = "Relax"
    party = "Party"


class EventOptionBase(SQLModel):
    title: str
    category: EventCategory
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    location_region: str
    est_price_pp: float
    min_participants: Optional[int] = None
    accessibility_flags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    weather_dependent: bool = False
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_mystery: bool = False
    season: str = Field(default="all_year")


class EventOption(EventOptionBase, table=True):
    __tablename__ = "event_options"
    id: Optional[str] = Field(default=None, primary_key=True)


class CampaignEventOption(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaign.id", index=True)
    event_option_id: str = Field(foreign_key="event_options.id", index=True)


class StretchGoal(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaign.id", index=True)
    amount_threshold: float
    reward_description: str
    unlocked: bool = False
    icon: Optional[str] = None


class BadgeType(str, Enum):
    whale = "whale"
    early_bird = "early_bird"
    closer = "closer"


class PrivateContribution(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaign.id", index=True)
    user_name: str
    amount: float
    is_hero: bool = False
    is_anonymous: bool = False
    badge: Optional[BadgeType] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class UserProfile(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    name: str
    dept_code: str = Field(foreign_key="department.dept_code", index=True)
    hobbies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    history: dict = Field(default_factory=lambda: {"liked_categories": []}, sa_column=Column(JSON))
    super_likes_remaining: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Vote(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaign.id", index=True)
    event_id: str = Field(foreign_key="event_options.id", index=True)
    user_id: Optional[str] = Field(default=None, foreign_key="userprofile.id", index=True)
    session_id: Optional[str] = Field(default=None, index=True)
    weight: int = 1
    is_super_like: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Availability(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)
    campaign_id: str = Field(foreign_key="campaign.id", index=True)
    user_id: Optional[str] = Field(default=None, foreign_key="userprofile.id", index=True)
    session_id: Optional[str] = Field(default=None, index=True)
    date: str
    slots: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Room(SQLModel, table=True):
    token: str = Field(default_factory=lambda: uuid4().hex[:8], primary_key=True, index=True)
    dept_code: str
    campaign_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
