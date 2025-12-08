from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine, select

from .config import get_settings


settings = get_settings()


def _prepare_sqlite_path(db_url: str) -> None:
    if db_url.startswith("sqlite"):
        # sqlite:///./data/data.db -> extract local path after third slash
        raw_path = db_url.split("sqlite:///")[-1]
        path = Path(raw_path)
        if not path.is_absolute():
            path = Path.cwd() / path
        path.parent.mkdir(parents=True, exist_ok=True)


_prepare_sqlite_path(settings.database_url)

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def seed_event_options(session: Session) -> None:
    """Seed a minimal set of event options per region if missing."""
    from app.models import (
        EventOption,
        EventCategory,
    )  # local import to avoid circular deps

    legacy_image_fixes = {
        "https://images.unsplash.com/photo-1518609559197-2a6c2f3b9c4f?w=600": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502844521879-c88f28c5e62f?w=600": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522204781483-3c9f22030d9e?w=600": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518621743603-f32a0d1d3c2a?w=600": "https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517646549293-1b2c4d7d9e4a?w=600": "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551690025-a6e5a6f2b7b5?w=600": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1558229988-c9c0f9b6e6f4?w=600": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502476100147-3860d5b5b0d0?w=600": "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
    }

    fixes_applied = False
    for old_url, new_url in legacy_image_fixes.items():
        matches = session.exec(
            select(EventOption).where(EventOption.image_url == old_url)
        ).all()
        for event in matches:
            event.image_url = new_url
            fixes_applied = True

    if fixes_applied:
        session.commit()

    seeds_by_region = {
        "OOE": [
            dict(
                title="Masters of Escape",
                category=EventCategory.action,
                tags=["escape-game", "teambuidling", "puzzle"],
                location_region="OOE",
                est_price_pp=30,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
                season="all_year",
                short_description="Teamstärkende Rätsel, Spannung, Kooperation, unvergesslicher Spaß.",
                long_description="Adrenalin, Teamgeist und Rätselspaß: In dieser Escape Room Challenge wachst Ihr als Team zusammen, kommuniziert besser und feiert gemeinsam den Erfolg.",
                physical_intensity=2,
                mental_challenge=5,
                social_interaction_level=5,
                price_comment="Gruppen ab 10 Personen erhalten 20% Rabatt",
                external_rating=4.9,
                lead_time_min_days=7,
                risk_level="low",
                travel_time_from_office_minutes=5,
                address="Kaarstraße 9, 4040 Linz",
                website="https://www.mastersofescape.at",
                provider="Masters Of Escape OG",
                phone="06764315788",
                email="linz@moescape.com",
            ),
        ],
    }

    for region, items in seeds_by_region.items():
        exists = session.exec(
            select(EventOption).where(EventOption.location_region == region)
        ).first()
        if exists:
            continue
        session.add_all([EventOption(**item) for item in items])
    session.commit()


def _ensure_voting_deadline_column() -> None:
    """Ensure new column exists on sqlite without a full migration system."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        cols = conn.exec_driver_sql("PRAGMA table_info(campaign);").fetchall()
        names = {c[1] for c in cols}
        if "voting_deadline" not in names:
            conn.exec_driver_sql("ALTER TABLE campaign ADD COLUMN voting_deadline TIMESTAMP;")


def init_db() -> None:
    """Create database tables. Call this once at startup."""
    from app import models  # noqa: F401 - triggers model registration

    SQLModel.metadata.create_all(bind=engine)
    _ensure_voting_deadline_column()
    with Session(engine) as session:
        seed_event_options(session)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
