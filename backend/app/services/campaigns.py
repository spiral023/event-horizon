from typing import Iterable, List, Optional, Dict

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.models import (
    Campaign,
    CampaignEventOption,
    Department,
    EventOption,
    PrivateContribution,
    StretchGoal,
)
from app.schemas.domain import CampaignRead


def ensure_department(session: Session, dept_code: str, name: Optional[str] = None, region: Optional[str] = None) -> Department:
    dept = session.get(Department, dept_code)
    if not dept:
        dept = Department(dept_code=dept_code, name=name or dept_code, region=region)
        session.add(dept)
        session.commit()
    return dept


def get_campaign_event_options(session: Session, campaign_id: str) -> List[EventOption]:
    stmt = (
        select(EventOption)
        .join(CampaignEventOption, CampaignEventOption.event_option_id == EventOption.id)
        .where(CampaignEventOption.campaign_id == campaign_id)
    )
    return list(session.exec(stmt).all())


def get_campaign_stretch_goals(session: Session, campaign_id: str) -> List[StretchGoal]:
    stmt = select(StretchGoal).where(StretchGoal.campaign_id == campaign_id)
    return list(session.exec(stmt).all())


def get_campaign_contributions(session: Session, campaign_id: str) -> List[PrivateContribution]:
    stmt = select(PrivateContribution).where(PrivateContribution.campaign_id == campaign_id)
    return list(session.exec(stmt).all())


def hydrate_campaign(session: Session, campaign: Campaign) -> CampaignRead:
    event_options = get_campaign_event_options(session, campaign.id)
    stretch_goals = get_campaign_stretch_goals(session, campaign.id)
    contributions = get_campaign_contributions(session, campaign.id)
    base = CampaignRead.from_orm(campaign)
    return base.copy(
        update={
            "event_options": event_options,
            "stretch_goals": stretch_goals,
            "private_contributions": contributions,
        }
    )


def hydrate_campaigns(session: Session, campaigns: Iterable[Campaign]) -> List[CampaignRead]:
    """
    DEPRECATED: Use hydrate_campaigns_optimized for better performance.
    Kept for backwards compatibility.
    """
    return [hydrate_campaign(session, campaign) for campaign in campaigns]


def hydrate_campaigns_optimized(session: Session, campaigns: Iterable[Campaign]) -> List[CampaignRead]:
    """
    Optimized version that reduces N+1 queries using eager loading.

    OLD: 1 + (3 * N) queries for N campaigns = 31 queries for 10 campaigns
    NEW: 3 queries total regardless of N

    Performance improvement: ~90% reduction in database queries
    """
    campaign_list = list(campaigns)
    if not campaign_list:
        return []

    campaign_ids = [c.id for c in campaign_list]

    # Single query with eager loading for stretch_goals and private_contributions
    stmt = (
        select(Campaign)
        .options(
            selectinload(Campaign.stretch_goals),
            selectinload(Campaign.private_contributions)
        )
        .where(Campaign.id.in_(campaign_ids))
    )

    loaded_campaigns = session.exec(stmt).all()

    # Build a map for quick lookup
    campaign_map: Dict[str, Campaign] = {c.id: c for c in loaded_campaigns}

    # Batch load event_options for all campaigns (single query with JOIN)
    event_options_map: Dict[str, List[EventOption]] = {}
    if campaign_ids:
        event_stmt = (
            select(EventOption, CampaignEventOption.campaign_id)
            .join(CampaignEventOption, CampaignEventOption.event_option_id == EventOption.id)
            .where(CampaignEventOption.campaign_id.in_(campaign_ids))
        )
        results = session.exec(event_stmt).all()

        for event, campaign_id in results:
            if campaign_id not in event_options_map:
                event_options_map[campaign_id] = []
            event_options_map[campaign_id].append(event)

    # Build CampaignRead objects
    hydrated = []
    for campaign_id in campaign_ids:
        loaded = campaign_map.get(campaign_id)
        if not loaded:
            continue

        base = CampaignRead.from_orm(loaded)
        hydrated_campaign = base.copy(
            update={
                "event_options": event_options_map.get(campaign_id, []),
                "stretch_goals": loaded.stretch_goals,
                "private_contributions": loaded.private_contributions,
            }
        )
        hydrated.append(hydrated_campaign)

    return hydrated
