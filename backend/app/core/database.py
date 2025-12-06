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

    seeds_by_region = {
        "Tirol": [
            dict(
                title="Alpen Co-Working Innsbruck",
                category=EventCategory.relax,
                tags=["indoor", "focus", "team"],
                location_region="Tirol",
                est_price_pp=40,
                min_participants=4,
                accessibility_flags=[],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600",
                description="Co-Working Tag mit Blick auf die Nordkette, Meetingraum & Kaffee-Flat.",
            ),
            dict(
                title="Snow & Fun Stubai",
                category=EventCategory.action,
                tags=["outdoor", "snow", "adventure"],
                location_region="Tirol",
                est_price_pp=75,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600",
                description="Rodeln, Zipline und Glühwein-Stopps im Stubaital.",
            ),
            dict(
                title="Strategy Retreat Achensee",
                category=EventCategory.relax,
                tags=["offsite", "strategy", "indoor"],
                location_region="Tirol",
                est_price_pp=85,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600",
                description="Intensiver Strategietag in einem Seminarhotel am Achensee mit moderiertem Workshop und Wellnessbereich.",
            ),
            dict(
                title="Escape Room Challenge Innsbruck",
                category=EventCategory.action,
                tags=["indoor", "puzzle", "team"],
                location_region="Tirol",
                est_price_pp=49,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600",
                description="Zeitkritische Escape-Room Missionen für kleine Teams – ideal für Kommunikation & Problemlösung.",
            ),
            dict(
                title="Alpin Wellness Day Seefeld",
                category=EventCategory.relax,
                tags=["indoor", "spa", "relax"],
                location_region="Tirol",
                est_price_pp=95,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1519823551271-9d2a4f9efb0c?w=600",
                description="Firmen-Wellnesstag mit Spa, leichtem Aktivprogramm und gesundem Buffet in Seefeld.",
            ),
        ],
        "Stmk": [
            dict(
                title="Genusstour Graz",
                category=EventCategory.food,
                tags=["urban", "food", "walking"],
                location_region="Stmk",
                est_price_pp=55,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600",
                description="Kulinarische Stadtführung durch Graz mit Hauben-Stopps.",
            ),
            dict(
                title="Weinwandern Suedsteiermark",
                category=EventCategory.relax,
                tags=["outdoor", "wine", "nature"],
                location_region="Stmk",
                est_price_pp=60,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1514369118554-e20d93546b30?w=600",
                description="Weinberge, Jäusen und Panoramablicke in der Suedsteiermark.",
            ),
            dict(
                title="Design Thinking Lab Graz",
                category=EventCategory.relax,
                tags=["indoor", "workshop", "innovation"],
                location_region="Stmk",
                est_price_pp=80,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600",
                description="Moderierter Design-Thinking-Workshop für neue Produkt- und Prozessideen in einem Kreativ-Loft.",
            ),
            dict(
                title="Team-Parcours Suedsteiermark",
                category=EventCategory.action,
                tags=["outdoor", "high-ropes", "team"],
                location_region="Stmk",
                est_price_pp=65,
                min_participants=8,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600",
                description="Waldseilgarten mit Teamaufgaben, Flying-Fox und gemeinsamer Buschenschank-Jause.",
            ),
            dict(
                title="Kochstudio Teamevent Graz",
                category=EventCategory.food,
                tags=["indoor", "cooking", "team"],
                location_region="Stmk",
                est_price_pp=75,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600",
                description="Gemeinsames Kochen eines mehrgängigen Menüs mit Profi-Koch inkl. Rezeptmappe für alle.",
            ),
        ],
        "Sbg": [
            dict(
                title="Panorama-Dinner Moenchsberg",
                category=EventCategory.food,
                tags=["elegant", "view", "city"],
                location_region="Sbg",
                est_price_pp=95,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600",
                description="Private Dinner mit Stadtblick und regionalem Degustationsmenü.",
            ),
            dict(
                title="E-MTB Salzkammergut",
                category=EventCategory.action,
                tags=["outdoor", "nature", "fitness"],
                location_region="Sbg",
                est_price_pp=70,
                min_participants=5,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600",
                description="Geführte E-MTB Tour mit See-Stopps und Almjausen.",
            ),
            dict(
                title="Escape Game Altstadt Salzburg",
                category=EventCategory.action,
                tags=["indoor", "puzzle", "city"],
                location_region="Sbg",
                est_price_pp=52,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600",
                description="Indoor-Escape-Game in der Altstadt mit individuell angepassten Firmenstories.",
            ),
            dict(
                title="Seminartag Fuschlsee",
                category=EventCategory.relax,
                tags=["offsite", "lake", "meeting"],
                location_region="Sbg",
                est_price_pp=90,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?w=600",
                description="Ganztägiger Seminartag in einem Hotel am Fuschlsee mit Meetingraum, Technik und Kaffeepausen.",
            ),
            dict(
                title="Almhuetten-Abend Gasteinertal",
                category=EventCategory.food,
                tags=["outdoor", "hut", "music"],
                location_region="Sbg",
                est_price_pp=80,
                min_participants=8,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
                description="Auffahrt zur Alm, regionales Abendessen, Musik und optional Fackelwanderung zurück ins Tal.",
            ),
        ],
        "Ktn": [
            dict(
                title="Woerthersee Sunset Cruise",
                category=EventCategory.relax,
                tags=["boat", "sunset", "chill"],
                location_region="Ktn",
                est_price_pp=65,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1511497584788-876760111969?w=600",
                description="Afterwork-Bootstour mit Drinks und Musik am Woerthersee.",
            ),
            dict(
                title="Pyramidenkogel Team-Challenge",
                category=EventCategory.action,
                tags=["view", "adventure", "team"],
                location_region="Ktn",
                est_price_pp=45,
                min_participants=5,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600",
                description="Aussichtsturm, Flying-Fox und Team-Rallye am Pyramidenkogel.",
            ),
            dict(
                title="Innovation Day Klagenfurt",
                category=EventCategory.relax,
                tags=["indoor", "workshop", "innovation"],
                location_region="Ktn",
                est_price_pp=79,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600",
                description="Kompakter Innovationstag mit Kurzinputs, Gruppenarbeiten und Pitch-Session in einem modernen Workspace.",
            ),
            dict(
                title="Teamsegeln Ossiacher See",
                category=EventCategory.action,
                tags=["outdoor", "water", "team"],
                location_region="Ktn",
                est_price_pp=70,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1518831959410-48a934a5fbe5?w=600",
                description="Geführtes Segel-Teamevent mit Manövertraining und kleiner Regatta am Ossiacher See.",
            ),
            dict(
                title="Kochkurs Kaerntner Küche",
                category=EventCategory.food,
                tags=["indoor", "cooking", "local"],
                location_region="Ktn",
                est_price_pp=72,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600",
                description="Gemeinsames Zubereiten typischer Kärntner Spezialitäten wie Kasnudeln und Reindling mit Profi-Koch.",
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


def init_db() -> None:
    """Create database tables. Call this once at startup."""
    from app import models  # noqa: F401 - triggers model registration

    SQLModel.metadata.create_all(bind=engine)
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
