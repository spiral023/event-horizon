from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, delete, select

from app.core.database import get_session
from app.models import Availability, Campaign, CampaignEventOption, EventOption, PrivateContribution, StretchGoal, Vote
from app.schemas.domain import (
    ApiMessage,
    AvailabilityPayload,
    CampaignCreate,
    CampaignRead,
    CampaignUpdate,
    StretchGoalCreate,
    PrivateContributionCreate,
    TeamAnalytics,
    VotePayload,
)
from app.services.analytics import build_team_analytics
from app.services.budget import add_contribution
from app.services.campaigns import (
    ensure_department,
    get_campaign_contributions,
    get_campaign_event_options,
    get_campaign_stretch_goals,
    hydrate_campaign,
    hydrate_campaigns,
)


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=List[CampaignRead])
def list_campaigns(
    dept_code: str = Query(..., description="Department code"),
    session: Session = Depends(get_session),
) -> List[CampaignRead]:
    campaigns = session.exec(select(Campaign).where(Campaign.dept_code == dept_code)).all()
    return hydrate_campaigns(session, campaigns)


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_campaign_detail(
    campaign_id: str,
    session: Session = Depends(get_session),
) -> CampaignRead:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return hydrate_campaign(session, campaign)


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    session: Session = Depends(get_session),
) -> CampaignRead:
    ensure_department(session, payload.dept_code)

    campaign = Campaign(
        name=payload.name,
        dept_code=payload.dept_code,
        target_date_range=payload.target_date_range,
        status=payload.status,
        total_budget_needed=payload.total_budget_needed,
        company_budget_available=payload.company_budget_available,
        budget_per_participant=payload.budget_per_participant,
        external_sponsors=payload.external_sponsors,
        winning_event_id=payload.winning_event_id,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    # Event options
    created_events: List[EventOption] = []
    for option in payload.event_options:
        if option.id:
            existing = session.get(EventOption, option.id)
            if existing:
                created_events.append(existing)
                link = CampaignEventOption(campaign_id=campaign.id, event_option_id=existing.id)
                session.add(link)
                continue
        new_option = EventOption(**option.dict(exclude={"id"}))
        session.add(new_option)
        session.commit()
        session.refresh(new_option)
        created_events.append(new_option)
        session.add(CampaignEventOption(campaign_id=campaign.id, event_option_id=new_option.id))

    # Stretch goals
    for goal in payload.stretch_goals:
        session.add(
            StretchGoal(
                campaign_id=campaign.id,
                amount_threshold=goal.amount_threshold,
                reward_description=goal.reward_description,
                unlocked=goal.unlocked,
                icon=goal.icon,
            )
        )

    session.commit()
    return hydrate_campaign(session, campaign)


@router.put("/{campaign_id}", response_model=CampaignRead, status_code=status.HTTP_200_OK)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    session: Session = Depends(get_session),
) -> CampaignRead:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)

    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return hydrate_campaign(session, campaign)


@router.put("/{campaign_id}/stretch-goals", response_model=CampaignRead, status_code=status.HTTP_200_OK)
def replace_stretch_goals(
    campaign_id: str,
    goals: List[StretchGoalCreate],
    session: Session = Depends(get_session),
) -> CampaignRead:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Remove existing stretch goals for this campaign
    session.exec(delete(StretchGoal).where(StretchGoal.campaign_id == campaign_id))
    session.commit()

    # Insert new ones
    for goal in goals:
        session.add(
            StretchGoal(
                campaign_id=campaign_id,
                amount_threshold=goal.amount_threshold,
                reward_description=goal.reward_description,
                unlocked=goal.unlocked,
                icon=goal.icon,
            )
        )
    session.commit()
    return hydrate_campaign(session, campaign)


@router.post("/{campaign_id}/votes", response_model=ApiMessage, status_code=status.HTTP_200_OK)
def submit_votes(
    campaign_id: str,
    votes: List[VotePayload],
    session: Session = Depends(get_session),
    user_id: Optional[str] = Query(None, description="User identifier (optional)"),
    session_id: Optional[str] = Query(None, description="Client session identifier (optional)"),
) -> ApiMessage:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Replace existing votes for the same user or session context
    if user_id:
        session.exec(delete(Vote).where(Vote.campaign_id == campaign_id, Vote.user_id == user_id))
    elif session_id:
        session.exec(delete(Vote).where(Vote.campaign_id == campaign_id, Vote.session_id == session_id))

    for payload in votes:
        session.add(
            Vote(
                campaign_id=campaign_id,
                event_id=payload.event_id,
                weight=payload.weight,
                is_super_like=payload.is_super_like,
                user_id=user_id,
                session_id=session_id,
            )
        )
    session.commit()
    return ApiMessage(message="Votes stored")


@router.post("/{campaign_id}/availability", response_model=ApiMessage, status_code=status.HTTP_200_OK)
def submit_availability(
    campaign_id: str,
    availability: List[AvailabilityPayload],
    session: Session = Depends(get_session),
    user_id: Optional[str] = Query(None, description="User identifier (optional)"),
    session_id: Optional[str] = Query(None, description="Client session identifier (optional)"),
) -> ApiMessage:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if user_id:
        session.exec(delete(Availability).where(Availability.campaign_id == campaign_id, Availability.user_id == user_id))
    elif session_id:
        session.exec(delete(Availability).where(Availability.campaign_id == campaign_id, Availability.session_id == session_id))

    for slot in availability:
        session.add(
            Availability(
                campaign_id=campaign_id,
                date=slot.date,
                slots=slot.slots,
                user_id=user_id,
                session_id=session_id,
            )
        )
    session.commit()
    return ApiMessage(message="Availability stored")


@router.post("/{campaign_id}/contributions", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def add_campaign_contribution(
    campaign_id: str,
    contribution: PrivateContributionCreate,
    session: Session = Depends(get_session),
) -> CampaignRead:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    new_contribution = PrivateContribution(
        campaign_id=campaign_id,
        user_name=contribution.user_name,
        amount=contribution.amount,
        is_hero=contribution.is_hero,
        is_anonymous=contribution.is_anonymous,
        badge=contribution.badge,
    )
    updated_campaign, _, _ = add_contribution(session, campaign, new_contribution)
    return hydrate_campaign(session, updated_campaign)


@router.get("/{campaign_id}/analytics", response_model=TeamAnalytics)
def get_campaign_analytics(
    campaign_id: str,
    session: Session = Depends(get_session),
) -> TeamAnalytics:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    events = get_campaign_event_options(session, campaign_id)
    votes = session.exec(select(Vote).where(Vote.campaign_id == campaign_id)).all()
    return build_team_analytics(events, votes)
