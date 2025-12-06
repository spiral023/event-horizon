"""
Kleines Auslese-Skript für die lokale/Remote-DB.
Nutzung (aus backend-Verzeichnis): python -m scripts.db_report
"""

from collections import Counter, defaultdict
from typing import Dict, List

from sqlmodel import select

from app.core.database import session_scope
from app.models import Campaign, EventOption, PrivateContribution, StretchGoal, Vote


def summarize_event_options() -> None:
    with session_scope() as session:
        events: List[EventOption] = session.exec(select(EventOption)).all()
        by_region: Dict[str, int] = Counter(e.location_region for e in events)
        by_category: Dict[str, int] = Counter(e.category for e in events)

    print("=== Event-Optionen ===")
    print(f"Gesamt: {len(events)}")
    print("Nach Region:")
    for region, count in sorted(by_region.items()):
        print(f"  {region}: {count}")
    print("Nach Kategorie:")
    for cat, count in sorted(by_category.items()):
        print(f"  {cat}: {count}")
    print()


def summarize_campaigns() -> None:
    with session_scope() as session:
        campaigns: List[Campaign] = session.exec(select(Campaign)).all()
        # Event-Optionen pro Kampagne
        event_counts = defaultdict(int)
        sg_counts = defaultdict(int)
        contrib_counts = defaultdict(int)
        vote_counts = defaultdict(int)

        for camp in campaigns:
            event_counts[camp.id] = session.exec(
                select(EventOption).join_from(EventOption, Campaign).where(Campaign.id == camp.id)
            ).count()
            sg_counts[camp.id] = session.exec(
                select(StretchGoal).where(StretchGoal.campaign_id == camp.id)
            ).count()
            contrib_counts[camp.id] = session.exec(
                select(PrivateContribution).where(PrivateContribution.campaign_id == camp.id)
            ).count()
            vote_counts[camp.id] = session.exec(
                select(Vote).where(Vote.campaign_id == camp.id)
            ).count()

    print("=== Kampagnen ===")
    print(f"Gesamt: {len(campaigns)}")
    for camp in campaigns:
        print(
            f"- {camp.name} ({camp.dept_code}) | Status: {camp.status} | "
            f"Events: {event_counts[camp.id]} | StretchGoals: {sg_counts[camp.id]} | "
            f"Beiträge: {contrib_counts[camp.id]} | Votes: {vote_counts[camp.id]}"
        )
    print()


def main() -> None:
    summarize_event_options()
    summarize_campaigns()


if __name__ == "__main__":
    main()
