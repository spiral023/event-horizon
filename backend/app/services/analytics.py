from collections import Counter
from typing import Iterable

from app.models import EventOption, Vote
from app.schemas.domain import TeamAnalytics


def _safe_div(num: float, denom: float) -> float:
    return num / denom if denom else 0


def build_team_analytics(events: Iterable[EventOption], votes: Iterable[Vote]) -> TeamAnalytics:
    event_lookup = {e.id: e for e in events}
    category_scores: Counter[str] = Counter()
    outdoor_votes = 0
    positive_votes = 0

    for vote in votes:
        event = event_lookup.get(vote.event_id)
        if not event or vote.weight <= 0:
            continue
        category_scores[event.category.value] += vote.weight
        positive_votes += vote.weight
        if "outdoor" in [t.lower() for t in event.tags]:
            outdoor_votes += vote.weight

    total_score = sum(category_scores.values())
    action_level = round(_safe_div(category_scores.get("Action", 0), total_score) * 100) if total_score else 25
    food_focus = round(_safe_div(category_scores.get("Food", 0), total_score) * 100) if total_score else 30
    outdoor_wish = round(_safe_div(outdoor_votes, positive_votes) * 100) if positive_votes else 20

    spread = category_scores.most_common()
    if spread:
        top_value = spread[0][1]
        bottom_value = spread[-1][1]
        compromise_score = max(40, min(100, 100 - int(_safe_div((top_value - bottom_value), (top_value + bottom_value + 1)) * 100)))
    else:
        compromise_score = 85

    persona_label = "Die Ausgewogenen"
    persona_description = "Euer Team mag Vielfalt und findet Kompromisse."
    if action_level > 50:
        persona_label = "Team Adrenalin-Junkies"
        persona_description = "Action und Abenteuer stehen ganz oben."
    elif food_focus > 50:
        persona_label = "Team Foodies"
        persona_description = "Essen und Genuss priorisieren alles."
    elif category_scores.get("Relax", 0) > category_scores.get("Action", 0):
        persona_label = "Team Chill & Grill"
        persona_description = "Entspannung und gutes Essen sind Favoriten."

    top_categories = [name for name, _ in category_scores.most_common(2)] or ["Action", "Food"]
    participation_rate = 90 if positive_votes else 80

    return TeamAnalytics(
        action_level=action_level,
        food_focus=food_focus,
        outdoor_wish=outdoor_wish,
        compromise_score=compromise_score,
        persona_label=persona_label,
        persona_description=persona_description,
        top_categories=top_categories,
        participation_rate=participation_rate,
    )
