from typing import Iterable, Tuple

from sqlmodel import Session, select

from app.models import BadgeType, Campaign, PrivateContribution, StretchGoal


def get_total_funded(campaign: Campaign, contributions: Iterable[PrivateContribution]) -> float:
    private_total = sum(c.amount for c in contributions)
    return campaign.company_budget_available + campaign.external_sponsors + private_total


def add_contribution(session: Session, campaign: Campaign, contribution: PrivateContribution) -> Tuple[Campaign, list[PrivateContribution], list[StretchGoal]]:
    session.add(contribution)
    session.commit()
    session.refresh(contribution)

    contributions = list(session.exec(select(PrivateContribution).where(PrivateContribution.campaign_id == campaign.id).order_by(PrivateContribution.created_at)).all())
    total_before = get_total_funded(campaign, contributions[:-1])
    total_after = get_total_funded(campaign, contributions)

    # Badges
    if contributions:
        earliest = contributions[0]
        earliest.badge = BadgeType.early_bird

        max_amount = max(c.amount for c in contributions)
        for c in contributions:
            if c.amount == max_amount and c.amount >= 100:
                c.badge = BadgeType.whale

    if total_before < campaign.total_budget_needed <= total_after:
        contribution.badge = BadgeType.closer

    # Stretch goals
    goals = list(session.exec(select(StretchGoal).where(StretchGoal.campaign_id == campaign.id)).all())
    for goal in goals:
        goal.unlocked = total_after >= goal.amount_threshold
        session.add(goal)

    session.add_all(contributions)
    session.commit()

    return campaign, contributions, goals
