from typing import Iterable, List, Optional

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
    return [hydrate_campaign(session, campaign) for campaign in campaigns]
