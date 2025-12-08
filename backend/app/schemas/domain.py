from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import BadgeType, CampaignStatus, EventCategory, PrimaryGoal, RiskLevel


class EventOptionBase(BaseModel):
    title: str
    category: EventCategory
    tags: List[str] = Field(default_factory=list)
    location_region: str  # e.g., "AT", "Tirol"
    est_price_pp: float
    min_participants: Optional[int] = None
    accessibility_flags: List[str] = Field(default_factory=list)
    weather_dependent: bool = False
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_mystery: bool = False
    season: str = "all_year"  # 'summer', 'winter', 'all_year'
    
    # Extended fields
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

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Event title cannot be empty')
        if len(v) > 200:
            raise ValueError('Event title too long (max 200 chars)')
        return v.strip()

    @field_validator('est_price_pp')
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError('Price per person must be non-negative')
        if v > 10000:
            raise ValueError('Price per person unrealistic (max 10000€)')
        return v

    @field_validator('min_participants')
    @classmethod
    def validate_min_participants(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError('Minimum participants must be at least 1')
        if v is not None and v > 1000:
            raise ValueError('Minimum participants unrealistic (max 1000)')
        return v


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

    @field_validator('amount_threshold')
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        if v < 0:
            raise ValueError('Amount threshold must be non-negative')
        if v > 1000:
            raise ValueError('Amount threshold unrealistic (max 1000%)')
        return v

    @field_validator('reward_description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Reward description cannot be empty')
        if len(v) > 500:
            raise ValueError('Reward description too long (max 500 chars)')
        return v.strip()


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

    @field_validator('user_name')
    @classmethod
    def validate_user_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('User name cannot be empty')
        if len(v) > 100:
            raise ValueError('User name too long (max 100 chars)')
        return v.strip()

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('Contribution amount must be positive')
        if v > 100000:
            raise ValueError('Contribution amount unrealistic (max 100000€)')
        return v


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
    voting_deadline: Optional[datetime] = None
    status: CampaignStatus = CampaignStatus.voting
    total_budget_needed: float
    company_budget_available: float
    budget_per_participant: Optional[float] = None
    external_sponsors: float = 0
    winning_event_id: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Campaign name cannot be empty')
        if len(v) > 200:
            raise ValueError('Campaign name too long (max 200 chars)')
        return v.strip()

    @field_validator('dept_code')
    @classmethod
    def validate_dept_code(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Department code cannot be empty')
        if len(v) > 50:
            raise ValueError('Department code too long (max 50 chars)')
        return v.strip().upper()

    @field_validator('target_date_range')
    @classmethod
    def validate_date_range(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Target date range cannot be empty')
        if len(v) > 100:
            raise ValueError('Target date range too long (max 100 chars)')
        return v.strip()

    @field_validator('total_budget_needed', 'company_budget_available', 'external_sponsors')
    @classmethod
    def validate_positive_budget(cls, v: float) -> float:
        if v < 0:
            raise ValueError('Budget values must be non-negative')
        if v > 1000000:
            raise ValueError('Budget value unrealistic (max 1000000€)')
        return v

    @field_validator('budget_per_participant')
    @classmethod
    def validate_budget_pp(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError('Budget per participant must be non-negative')
        if v is not None and v > 10000:
            raise ValueError('Budget per participant unrealistic (max 10000€)')
        return v


class CampaignCreate(CampaignBase):
    event_options: List[EventOptionCreate] = Field(default_factory=list)
    stretch_goals: List[StretchGoalCreate] = Field(default_factory=list)


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    target_date_range: Optional[str] = None
    voting_deadline: Optional[datetime] = None
    status: Optional[CampaignStatus] = None
    total_budget_needed: Optional[float] = None
    company_budget_available: Optional[float] = None
    budget_per_participant: Optional[float] = None
    external_sponsors: Optional[float] = None
    winning_event_id: Optional[str] = None


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
