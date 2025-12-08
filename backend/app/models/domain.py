from datetime import datetime
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel

# TYPE_CHECKING prevents circular imports
if TYPE_CHECKING:
    from .domain import EventOption, StretchGoal, PrivateContribution


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
    voting_deadline: Optional[datetime] = Field(default=None, nullable=True)
    status: CampaignStatus = Field(default=CampaignStatus.voting)
    total_budget_needed: float
    company_budget_available: float
    budget_per_participant: Optional[float] = None
    external_sponsors: float = 0
    winning_event_id: Optional[str] = Field(default=None, foreign_key="event_options.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships for eager loading (fixes N+1 query problem)
    stretch_goals: List["StretchGoal"] = Relationship(back_populates="campaign")
    private_contributions: List["PrivateContribution"] = Relationship(back_populates="campaign")


class EventCategory(str, Enum):
    action = "action"
    food = "food"
    relax = "relax"
    party = "party"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PrimaryGoal(str, Enum):
    fun = "fun"
    teambuilding = "teambuilding"
    reward = "reward"
    networking = "networking"
    learning = "learning"
    creativity = "creativity"


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
    # Neue erweiterte Felder
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    physical_intensity: Optional[int] = Field(default=None, ge=1, le=5)
    mental_challenge: Optional[int] = Field(default=None, ge=1, le=5)
    social_interaction_level: Optional[int] = Field(default=None, ge=1, le=5)
    price_comment: Optional[str] = None
    external_rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    lead_time_min_days: Optional[int] = Field(default=None, ge=0)
    risk_level: Optional[RiskLevel] = None
    travel_time_from_office_minutes: Optional[int] = Field(default=None, ge=0)
    travel_time_from_office_minutes_walking: Optional[int] = Field(default=None, ge=0)
    address: Optional[str] = None
    website: Optional[str] = None
    provider: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    primary_goal: Optional[PrimaryGoal] = None
    competition_level: Optional[int] = Field(default=None, ge=1, le=5)
    typical_duration_hours: Optional[float] = Field(default=None, ge=0)
    recommended_group_size_min: Optional[int] = Field(default=None, ge=1)
    recommended_group_size_max: Optional[int] = Field(default=None, ge=1)


class EventOption(EventOptionBase, table=True):
    __tablename__ = "event_options"
    id: str = Field(default_factory=gen_id, primary_key=True, index=True)


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

    # Relationship back to campaign
    campaign: Optional["Campaign"] = Relationship(back_populates="stretch_goals")


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

    # Relationship back to campaign
    campaign: Optional["Campaign"] = Relationship(back_populates="private_contributions")


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
