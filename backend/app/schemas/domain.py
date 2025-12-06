from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import BadgeType, CampaignStatus, EventCategory


class EventOptionBase(BaseModel):
    title: str
    category: EventCategory
    tags: List[str] = []
    location_region: str
    est_price_pp: float
    min_participants: Optional[int] = None
    accessibility_flags: List[str] = []
    weather_dependent: bool = False
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_mystery: bool = False


class EventOptionCreate(EventOptionBase):
    id: Optional[str] = None


class EventOptionRead(EventOptionBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class StretchGoalBase(BaseModel):
    amount_threshold: float
    reward_description: str
    unlocked: bool = False
    icon: Optional[str] = None


class StretchGoalCreate(StretchGoalBase):
    id: Optional[str] = None


class StretchGoalRead(StretchGoalBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class PrivateContributionBase(BaseModel):
    user_name: str
    amount: float
    is_hero: bool = False
    is_anonymous: bool = False
    badge: Optional[BadgeType] = None


class PrivateContributionCreate(PrivateContributionBase):
    id: Optional[str] = None


class PrivateContributionRead(PrivateContributionBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignBase(BaseModel):
    name: str
    dept_code: str
    target_date_range: str
    status: CampaignStatus = CampaignStatus.voting
    total_budget_needed: float
    company_budget_available: float
    external_sponsors: float = 0
    winning_event_id: Optional[str] = None


class CampaignCreate(CampaignBase):
    event_options: List[EventOptionCreate] = Field(default_factory=list)
    stretch_goals: List[StretchGoalCreate] = Field(default_factory=list)


class CampaignRead(CampaignBase):
    id: str
    created_at: datetime
    event_options: List[EventOptionRead] = Field(default_factory=list)
    stretch_goals: List[StretchGoalRead] = Field(default_factory=list)
    private_contributions: List[PrivateContributionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class VotePayload(BaseModel):
    event_id: str
    weight: int = 1
    is_super_like: bool = False


class AvailabilityPayload(BaseModel):
    date: str
    slots: List[str]


class TeamAnalytics(BaseModel):
    action_level: int
    food_focus: int
    outdoor_wish: int
    compromise_score: int
    persona_label: str
    persona_description: str
    top_categories: List[str]
    participation_rate: int


class RoomCreate(BaseModel):
    dept_code: str
    campaign_id: Optional[str] = None


class RoomRead(BaseModel):
    token: str
    dept_code: str
    campaign_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiMessage(BaseModel):
    message: str
