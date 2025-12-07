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
        "OOE": [
            dict(
                title="Cyber-Artists & Steel City",
                category=EventCategory.relax,
                tags=["digital", "art", "innovation", "urban"],
                location_region="OOE",
                est_price_pp=80,  # AEC + Mural combo approx
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1518609559197-2a6c2f3b9c4f?w=600",
                description="Vormittags Highlight-Führung im Ars Electronica Center inkl. Deep Space 8K. Mittagessen im Cubus. Nachmittags Mural Harbor Graffiti Workshop mit Bootsfahrt.",
                season="all_year",
            ),
            dict(
                title="E-Mobility Grand Prix",
                category=EventCategory.action,
                tags=["racing", "e-kart", "competition", "tech"],
                location_region="OOE",
                est_price_pp=70,  # Rotax MAX Dome exclusive est.
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1502844521879-c88f28c5e62f?w=600",
                description="Exklusive Bahnmiete im Rotax MAX Dome. Qualifying auf Simulatoren, Rennen in E-Karts. Abschluss mit Catering im Eventbereich.",
                season="all_year",
            ),
            dict(
                title="Mystery of the Future",
                category=EventCategory.action,
                tags=["escape-game", "city-rally", "puzzle", "team"],
                location_region="OOE",
                est_price_pp=40,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1522204781483-3c9f22030d9e?w=600",
                description="Ein Outdoor Escape Game oder eine iPad-Rallye durch die Linzer Innenstadt ('Blackout-Szenario').",
                season="all_year",
            ),
            dict(
                title="Industrial Titans Dinner",
                category=EventCategory.food,
                tags=["industry", "experience", "gourmet"],
                location_region="OOE",
                est_price_pp=150,  # Voestalpine + exclusive dinner
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600",
                description="Werkstour durch die Voestalpine gefolgt von einem exklusiven Dinner in einer industriellen Location (z.B. Turm 9 oder im Stahlwelt-Restaurant).",
                season="all_year",
            ),
            dict(
                title="Eisstock & Feuer",
                category=EventCategory.relax,
                tags=["winter", "tradition", "social"],
                location_region="OOE",
                est_price_pp=45,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,  # Winter activity
                image_url="https://images.unsplash.com/photo-1518621743603-f32a0d1d3c2a?w=600",
                description="Eisstockschießen auf einer innerstädtischen Bahn, kombiniert mit Glühweinempfang und anschließendem Reindlessen.",
                season="winter",
            ),
            dict(
                title="Bridge the Gap",
                category=EventCategory.relax,
                tags=["teambuidling", "creative", "indoor"],
                location_region="OOE",
                est_price_pp=60,
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600",
                description="Brückenbau-Challenge aus Karton oder Holz als Indoor-Event. Teams müssen Teile bauen, die am Ende zusammenpassen und tragfähig sind.",
                season="all_year",
            ),
            dict(
                title="Bubble Soccer Turnier",
                category=EventCategory.action,
                tags=["fun", "sport", "stress-relief"],
                location_region="OOE",
                est_price_pp=35,
                min_participants=10,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1517646549293-1b2c4d7d9e4a?w=600",
                description="Spaß-Fußballturnier in riesigen aufblasbaren Bällen ('Zorb Balls'). Körperkontakt ist erlaubt und gefahrlos möglich.",
                season="summer",
            ),
             dict(
                title="Donauschifffahrt Schlögener Schlinge",
                category=EventCategory.relax,
                tags=["boat", "nature", "view"],
                location_region="OOE",
                est_price_pp=35,
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1511497584788-876760111969?w=600",
                description="Entspannte Schifffahrt durch das Naturwunder Schlögener Schlinge.",
                season="summer",
            ),
        ],
        "Tirol": [
            dict(
                title="Olympic Ice Breaker",
                category=EventCategory.action,
                tags=["adrenaline", "winter", "bobsled"],
                location_region="Tirol",
                est_price_pp=45,
                min_participants=5,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1551690025-a6e5a6f2b7b5?w=600",
                description="Transfer nach Igls, Bob Rafting im Eiskanal, anschließend Siegerehrung und Tiroler Abend in einer Hütte.",
                season="winter",
            ),
            dict(
                title="Summit Strategy & Fondue",
                category=EventCategory.food,
                tags=["mountain", "view", "strategy", "gourmet"],
                location_region="Tirol",
                est_price_pp=85,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600",
                description="Auffahrt zur Seegrube, kurzes Seminar oder Workshop im Tagungsraum mit Ausblick, gefolgt von einem Käsefondue-Abend.",
                season="all_year",
            ),
            dict(
                title="Jump & Run",
                category=EventCategory.action,
                tags=["challenge", "city-exploration", "sport"],
                location_region="Tirol",
                est_price_pp=40,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600",
                description="Besichtigung der Bergisel Schanze inkl. Zitterbalken, danach eine 'Urban Challenge' (Schnitzeljagd) zurück in die Stadt.",
                season="all_year",
            ),
            dict(
                title="Mountain Cart Derby",
                category=EventCategory.action,
                tags=["fun", "outdoor", "racing"],
                location_region="Tirol",
                est_price_pp=30,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600",
                description="Nachmittag auf der Muttereralm mit mehreren Abfahrten in Mountain Carts. Team-Wettbewerb um die gleichmäßigste Zeit.",
                season="summer",
            ),
            dict(
                title="Crystal Creativity",
                category=EventCategory.relax,
                tags=["art", "design", "inspiration", "luxury"],
                location_region="Tirol",
                est_price_pp=70,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1558229988-c9c0f9b6e6f4?w=600",
                description="Exklusive Führung durch die Swarovski Kristallwelten mit Fokus auf Innovation und Design, gefolgt von einem Cocktail im Daniels.",
                season="all_year",
            ),
            dict(
                title="Alpine Survival",
                category=EventCategory.action,
                tags=["teambuidling", "nature", "adventure"],
                location_region="Tirol",
                est_price_pp=90,
                min_participants=8,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1502476100147-3860d5b5b0d0?w=600",
                description="Iglu-Bau-Workshop (Winter) oder Floßbau (Sommer) im Kühtai oder Umgebung. Anleitung durch Bergführer.",
                season="all_year",
            ),
            dict(
                title="Tyrolean Highland Games",
                category=EventCategory.action,
                tags=["fun", "tradition", "competition"],
                location_region="Tirol",
                est_price_pp=75,
                min_participants=10,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600",
                description="Rustikale Spiele auf einer Alm (Nageln, Maßkrugstemmen, Tauziehen).",
                season="summer",
            ),
        ],
        "Sbg": [
            dict(
                title="Wings of Excellence",
                category=EventCategory.relax,
                tags=["technology", "aviation", "luxury", "networking"],
                location_region="Sbg",
                est_price_pp=100,
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600",
                description="Private Führung durch den Hangar-7 mit Fokus auf die Technik der Flying Bulls, gefolgt von Cocktails in der Mayday Bar.",
                season="all_year",
            ),
            dict(
                title="Miner's Deep Dive",
                category=EventCategory.action,
                tags=["history", "adventure", "team"],
                location_region="Sbg",
                est_price_pp=50,
                min_participants=8,
                accessibility_flags=[],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1551690025-a6e5a6f2b7b5?w=600",
                description="Exklusive Führung in den Salzwelten Hallein mit Floßfahrt und Rutschen-Wettbewerb. Optional: Catering unter Tage.",
                season="all_year",
            ),
            dict(
                title="The Sound of Beer",
                category=EventCategory.food,
                tags=["beer", "craft", "culinary", "social"],
                location_region="Sbg",
                est_price_pp=45,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1518621743603-f32a0d1d3c2a?w=600",
                description="„Genussreise“ in der Stiegl Brauwelt. Verkostung seltener Jahrgangsbiere und Food-Pairing.",
                season="all_year",
            ),
            dict(
                title="Prankster's Palace",
                category=EventCategory.relax,
                tags=["fun", "water", "history", "humor"],
                location_region="Sbg",
                est_price_pp=25,
                min_participants=10,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1522204781483-3c9f22030d9e?w=600",
                description="Tour durch die Wasserspiele Hellbrunn, danach Picknick oder Dinner im Schlosspark.",
                season="summer",
            ),
            dict(
                title="Mozart Code City Hunt",
                category=EventCategory.action,
                tags=["city-exploration", "puzzle", "team", "culture"],
                location_region="Sbg",
                est_price_pp=35,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600",
                description="iPad-Rallye durch die Altstadt. Aufgaben beziehen sich auf Mozart, Jedermann und die Festspiele.",
                season="all_year",
            ),
            dict(
                title="Gorge Adventure",
                category=EventCategory.action,
                tags=["canyoning", "outdoor", "adventure", "challenge"],
                location_region="Sbg",
                est_price_pp=90,
                min_participants=4,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1502476100147-3860d5b5b0d0?w=600",
                description="Canyoning-Einsteigertour in der Nähe der Stadt (z.B. Wiestal).",
                season="summer",
            ),
            dict(
                title="Festungs-Challenge",
                category=EventCategory.action,
                tags=["history", "team", "fun", "medieval"],
                location_region="Sbg",
                est_price_pp=60,
                min_participants=8,
                accessibility_flags=[],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600",
                description="Aufstieg zur Festung Hohensalzburg, Bogenschießen oder historische Spiele im Burghof, gefolgt von einem Ritteressen.",
                season="all_year",
            ),
        ],
        "Stmk": [
            dict(
                title="Slide & Dine",
                category=EventCategory.relax,
                tags=["view", "thrill", "gourmet", "urban"],
                location_region="Stmk",
                est_price_pp=70,  # Schlossberg + dinner
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600",
                description="Auffahrt auf den Schlossberg, Aperitif im Aiola Upstairs, dann rasante Abfahrt durch 'The Slide'. Abendessen in der Altstadt.",
                season="all_year",
            ),
            dict(
                title="Steirische Genuss-Safari",
                category=EventCategory.food,
                tags=["culinary", "city-exploration", "local"],
                location_region="Stmk",
                est_price_pp=60,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1518621743603-f32a0d1d3c2a?w=600",
                description="Geführte kulinarische Tour (GenussRallye) mit Blindverkostungen. Teams müssen Zutaten erraten.",
                season="all_year",
            ),
            dict(
                title="Chocolate Innovation Trip",
                category=EventCategory.food,
                tags=["chocolate", "innovation", "sustainability", "workshop"],
                location_region="Stmk",
                est_price_pp=50,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1558229988-c9c0f9b6e6f4?w=600",
                description="Busfahrt zu Zotter. Führung mit Fokus auf CSR und Innovation. Brainstorming im 'Ideenfriedhof'.",
                season="all_year",
            ),
            dict(
                title="Office Golf Championship",
                category=EventCategory.relax,
                tags=["fun", "indoor", "sport"],
                location_region="Stmk",
                est_price_pp=40,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1522204781483-3c9f22030d9e?w=600",
                description="Durchführung eines Office Golf Turniers im Seminarhotel oder in der Firmenzentrale.",
                season="all_year",
            ),
            dict(
                title="Design & Flow",
                category=EventCategory.relax,
                tags=["design", "creative", "innovation", "urban"],
                location_region="Stmk",
                est_price_pp=80,
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1517646549293-1b2c4d7d9e4a?w=600",
                description="Exklusiver Abend auf der Murinsel. Design-Thinking Workshop in der futuristischen Umgebung, gefolgt von Cocktails.",
                season="all_year",
            ),
            dict(
                title="The Styrian Spy",
                category=EventCategory.action,
                tags=["escape-game", "city-exploration", "puzzle", "team"],
                location_region="Stmk",
                est_price_pp=35,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600",
                description="Outdoor Escape Game durch die Grazer Altstadt, das historische Fakten mit einer Spionage-Story verknüpft.",
                season="all_year",
            ),
            dict(
                title="Arnold's Roots",
                category=EventCategory.action,
                tags=["motivation", "challenge", "museum", "sport"],
                location_region="Stmk",
                est_price_pp=30,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600",
                description="Besuch im Arnold Schwarzenegger Museum in Thal, kombiniert mit einer kleinen Fitness-Challenge oder Bogenschießen.",
                season="all_year",
            ),
        ],
        "Ktn": [
            dict(
                title="Lord of the Skies",
                category=EventCategory.action,
                tags=["animals", "nature", "team", "unique"],
                location_region="Ktn",
                est_price_pp=200,  # Falkner workshop high price
                min_participants=5,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1551690025-a6e5a6f2b7b5?w=600",
                description="Falkner-Workshop auf der Burg Landskron. Lernen über Fokus und Vertrauen, während ein Adler auf der Hand landet. Danach Ritteressen in der Burg.",
                season="summer",
            ),
            dict(
                title="Monkey Business Strategy",
                category=EventCategory.relax,
                tags=["animals", "observation", "soft-skills"],
                location_region="Ktn",
                est_price_pp=30,
                min_participants=8,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1502476100147-3860d5b5b0d0?w=600",
                description="Private VIP-Führung am Affenberg. Beobachtung der sozialen Dynamiken der Makaken mit Übertragung auf Unternehmensstrukturen (moderiert).",
                season="summer",
            ),
            dict(
                title="Drau River Casino",
                category=EventCategory.party,
                tags=["luxury", "networking", "boat", "fun"],
                location_region="Ktn",
                est_price_pp=150,  # Charter + Casino
                min_participants=10,
                accessibility_flags=["wheelchair"],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1518621743603-f32a0d1d3c2a?w=600",
                description="Charter der MS Landskron. Aufbau von Casinotischen (Roulette, Blackjack) an Bord. Fahrt in den Sonnenuntergang.",
                season="summer",
            ),
            dict(
                title="Citrus & Spice",
                category=EventCategory.food,
                tags=["culinary", "sensory", "workshop", "local"],
                location_region="Ktn",
                est_price_pp=20,
                min_participants=6,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1558229988-c9c0f9b6e6f4?w=600",
                description="Führung und Verkostung im Zitrusgarten. Anschließend Workshop: Herstellung von Zitrus-Salz oder Kochen mit den exotischen Früchten.",
                season="summer",
            ),
            dict(
                title="Thermal Reset",
                category=EventCategory.relax,
                tags=["wellness", "spa", "relaxation"],
                location_region="Ktn",
                est_price_pp=60,
                min_participants=4,
                accessibility_flags=["wheelchair"],
                weather_dependent=False,
                image_url="https://images.unsplash.com/photo-1522204781483-3c9f22030d9e?w=600",
                description="Nach einem anstrengenden Seminar-Tag exklusiver Abendeintritt in die KärntenTherme (Sauna & Hamam).",
                season="all_year",
            ),
            dict(
                title="Forest Fly-Line",
                category=EventCategory.action,
                tags=["zipline", "outdoor", "team", "fun"],
                location_region="Ktn",
                est_price_pp=30,
                min_participants=6,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1502476100147-3860d5b5b0d0?w=600",
                description="Teamevent im Kletterwald Ossiacher See mit Schwerpunkt auf der Fly-Line und Team-Parcours am Boden.",
                season="summer",
            ),
            dict(
                title="Dreiländereck Tour",
                category=EventCategory.action,
                tags=["e-bike", "outdoor", "sport", "cross-border"],
                location_region="Ktn",
                est_price_pp=70,
                min_participants=4,
                accessibility_flags=[],
                weather_dependent=True,
                image_url="https://images.unsplash.com/photo-1549429532-680c2f21a4f0?w=600",
                description="E-Bike Tour von Villach Richtung italienische Grenze (Tarvis) auf dem Alpe-Adria-Radweg. Pizza-Essen in Italien und Rückfahrt.",
                season="summer",
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
