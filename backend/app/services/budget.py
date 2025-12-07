import logging
from typing import Iterable, Tuple

from sqlmodel import Session, select

from app.models import BadgeType, Campaign, PrivateContribution, StretchGoal

logger = logging.getLogger(__name__)


def get_total_funded(campaign: Campaign, contributions: Iterable[PrivateContribution]) -> float:
    private_total = sum(c.amount for c in contributions)
    return campaign.company_budget_available + campaign.external_sponsors + private_total


def add_contribution(session: Session, campaign: Campaign, contribution: PrivateContribution) -> Tuple[Campaign, list[PrivateContribution], list[StretchGoal]]:
    """
    Add a contribution with atomic transaction.

    OLD: 2 separate commits → data inconsistency risk
    NEW: Single transaction with rollback on error

    All operations (contribution, badges, stretch goals) are committed together
    or rolled back if any step fails.
    """
    try:
        # Add contribution and flush to get ID (but don't commit yet)
        session.add(contribution)
        session.flush()  # Gets ID without committing

        # Load all contributions for this campaign (including the new one)
        contributions = list(
            session.exec(
                select(PrivateContribution)
                .where(PrivateContribution.campaign_id == campaign.id)
                .order_by(PrivateContribution.created_at)
            ).all()
        )

        # Calculate totals
        total_before = get_total_funded(campaign, contributions[:-1])
        total_after = get_total_funded(campaign, contributions)
        percent_after = (total_after / campaign.total_budget_needed) * 100 if campaign.total_budget_needed else 0

        # Assign badges (all in same transaction)
        if contributions:
            # Early bird badge (first contributor)
            earliest = contributions[0]
            earliest.badge = BadgeType.early_bird

            # Whale badge (highest contribution >= 100€)
            max_amount = max(c.amount for c in contributions)
            for c in contributions:
                # Reset whale badge first (in case someone else contributed more)
                if c.badge == BadgeType.whale and c.amount < max_amount:
                    c.badge = None

                # Assign whale badge to highest contributor(s)
                if c.amount == max_amount and c.amount >= 100:
                    c.badge = BadgeType.whale

        # Closer badge (pushed campaign over the funding goal)
        if total_before < campaign.total_budget_needed <= total_after:
            contribution.badge = BadgeType.closer

        # Update stretch goals
        goals = list(
            session.exec(
                select(StretchGoal)
                .where(StretchGoal.campaign_id == campaign.id)
            ).all()
        )

        for goal in goals:
            # amount_threshold is interpreted as percentage (e.g. 100 = 100%)
            goal.unlocked = percent_after >= goal.amount_threshold

        # Single commit for all changes (atomic transaction)
        session.commit()

        # Refresh all objects to get latest state
        session.refresh(contribution)
        for c in contributions:
            session.refresh(c)
        for g in goals:
            session.refresh(g)

        logger.info(
            f"Contribution added: {contribution.amount}€ by {contribution.user_name} "
            f"(Campaign: {campaign.id}, Total: {total_after}€)"
        )

        return campaign, contributions, goals

    except Exception as e:
        # Rollback on any error to maintain data consistency
        session.rollback()
        logger.error(f"Failed to add contribution: {e}", exc_info=True)
        raise  # Re-raise to let caller handle HTTP error
