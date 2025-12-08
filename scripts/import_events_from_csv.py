"""
Import Event Options from CSV to database.py
Liest Event-Daten aus einer CSV-Datei und ersetzt die seeds_by_region Struktur in database.py
"""

import csv
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any


class EventCategory:
    """Event-Kategorien für Validierung"""
    action = "action"
    relax = "relax"
    food = "food"
    party = "party"

    @classmethod
    def all(cls):
        return [cls.action, cls.relax, cls.food, cls.party]


class PrimaryGoal:
    """Primary Goals für Validierung"""
    fun = "fun"
    teambuilding = "teambuilding"
    reward = "reward"
    networking = "networking"
    learning = "learning"
    creativity = "creativity"

    @classmethod
    def all(cls):
        return [cls.fun, cls.teambuilding, cls.reward, cls.networking, cls.learning, cls.creativity]


def validate_event(event: Dict[str, Any], row_num: int) -> List[str]:
    """
    Validiert einen Event-Eintrag.

    Returns:
        Liste von Fehlermeldungen (leer wenn valide)
    """
    errors = []

    # Pflichtfelder (nur das Nötigste)
    required_fields = ['title', 'location_region', 'est_price_pp', 'season']

    for field in required_fields:
        if not event.get(field):
            errors.append(f"Zeile {row_num}: Pflichtfeld '{field}' fehlt oder ist leer")

    # Kategorie validieren
    if event.get('category') and event['category'] not in EventCategory.all():
        errors.append(f"Zeile {row_num}: Ungültige Kategorie '{event['category']}'. Erlaubt: {', '.join(EventCategory.all())}")

    # Region validieren
    valid_regions = ['OOE', 'Tirol', 'Sbg', 'Stmk', 'Ktn']
    if event.get('location_region') and event['location_region'] not in valid_regions:
        errors.append(f"Zeile {row_num}: Ungültige Region '{event['location_region']}'. Erlaubt: {', '.join(valid_regions)}")

    # Season validieren
    valid_seasons = ['all_year', 'summer', 'winter']
    if event.get('season') and event['season'] not in valid_seasons:
        errors.append(f"Zeile {row_num}: Ungültige Season '{event['season']}'. Erlaubt: {', '.join(valid_seasons)}")

    # Risk Level validieren (optional)
    if event.get('risk_level'):
        valid_risk_levels = ['low', 'medium', 'high']
        if event['risk_level'] not in valid_risk_levels:
            errors.append(f"Zeile {row_num}: Ungültiges Risk Level '{event['risk_level']}'. Erlaubt: {', '.join(valid_risk_levels)}")

    # Primary Goal validieren (optional)
    if event.get('primary_goal'):
        if event['primary_goal'] not in PrimaryGoal.all():
            errors.append(f"Zeile {row_num}: Ungültiges Primary Goal '{event['primary_goal']}'. Erlaubt: {', '.join(PrimaryGoal.all())}")

    # Intensitäts-Level validieren (optional)
    for field in ['physical_intensity', 'mental_challenge', 'social_interaction_level', 'competition_level']:
        if event.get(field):
            try:
                value = int(event[field])
                if value < 1 or value > 5:
                    errors.append(f"Zeile {row_num}: {field} muss zwischen 1 und 5 liegen, ist aber {value}")
            except (ValueError, TypeError):
                errors.append(f"Zeile {row_num}: Ungültiger Wert für {field}: '{event.get(field)}'")

    # External Rating validieren (optional)
    if event.get('external_rating'):
        try:
            rating = float(event['external_rating'])
            if rating < 1.0 or rating > 5.0:
                errors.append(f"Zeile {row_num}: external_rating muss zwischen 1.0 und 5.0 liegen, ist aber {rating}")
        except (ValueError, TypeError):
            errors.append(f"Zeile {row_num}: Ungültiger Wert für external_rating: '{event.get('external_rating')}'")

    # Numerische Felder validieren
    try:
        price = float(event.get('est_price_pp', 0))
        if price <= 0:
            errors.append(f"Zeile {row_num}: Preis muss größer als 0 sein")
    except (ValueError, TypeError):
        errors.append(f"Zeile {row_num}: Ungültiger Preis '{event.get('est_price_pp')}'")

    # min_participants ist optional (0 bedeutet "nicht gesetzt")
    if event.get('min_participants'):
        try:
            participants = int(event.get('min_participants', 0))
            # 0 ist ok (bedeutet nicht gesetzt), nur negative Werte sind ungültig
            if participants < 0:
                errors.append(f"Zeile {row_num}: Minimale Teilnehmer darf nicht negativ sein")
        except (ValueError, TypeError):
            errors.append(f"Zeile {row_num}: Ungültige Teilnehmerzahl '{event.get('min_participants')}'")

    return errors


def parse_csv(csv_path: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Liest die CSV-Datei und gruppiert Events nach Region.

    Returns:
        Dictionary mit Region -> Liste von Events
    """
    events_by_region = {
        'OOE': [],
        'Tirol': [],
        'Sbg': [],
        'Stmk': [],
        'Ktn': []
    }

    all_errors = []

    with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')

        for row_num, row in enumerate(reader, start=2):  # Start bei 2 wegen Header
            # Parse Tags
            tags = [tag.strip() for tag in row.get('tags', '').split(',') if tag.strip()]

            # Parse Accessibility Flags
            accessibility_flags = [flag.strip() for flag in row.get('accessibility_flags', '').split(',') if flag.strip()]

            # Parse Boolean-Felder
            weather_dependent = row.get('weather_dependent', '').lower() in ['ja', 'yes', 'true', '1']
            is_mystery = row.get('is_mystery', '').lower() in ['ja', 'yes', 'true', '1']

            # Event-Dictionary erstellen
            # Deutsche Dezimalformate (Komma) in Punkt konvertieren für Preise
            price_str = row.get('est_price_pp', '0').strip().replace(',', '.')

            event = {
                'title': row.get('title', '').strip(),
                'category': row.get('category', '').strip(),
                'tags': tags,
                'location_region': row.get('location_region', '').strip(),
                'est_price_pp': price_str,
                'min_participants': row.get('min_participants', '0').strip(),
                'accessibility_flags': accessibility_flags,
                'weather_dependent': weather_dependent,
                'season': row.get('season', '').strip(),
                'description': row.get('description', '').strip(),
                'image_url': row.get('image_url', '').strip(),
                'is_mystery': is_mystery
            }

            # Neue erweiterte Felder (optional)
            if row.get('short_description', '').strip():
                event['short_description'] = row.get('short_description', '').strip()
            if row.get('long_description', '').strip():
                event['long_description'] = row.get('long_description', '').strip()
            if row.get('physical_intensity', '').strip():
                event['physical_intensity'] = int(row.get('physical_intensity', '0'))
            if row.get('mental_challenge', '').strip():
                event['mental_challenge'] = int(row.get('mental_challenge', '0'))
            if row.get('social_interaction_level', '').strip():
                event['social_interaction_level'] = int(row.get('social_interaction_level', '0'))
            if row.get('price_comment', '').strip():
                event['price_comment'] = row.get('price_comment', '').strip()
            if row.get('external_rating', '').strip():
                # Deutsche Dezimalformate (Komma) in Punkt konvertieren
                rating_str = row.get('external_rating', '0').replace(',', '.')
                event['external_rating'] = float(rating_str)
            if row.get('lead_time_min_days', '').strip():
                event['lead_time_min_days'] = int(row.get('lead_time_min_days', '0'))
            if row.get('risk_level', '').strip():
                event['risk_level'] = row.get('risk_level', '').strip()
            if row.get('travel_time_from_office_minutes', '').strip():
                event['travel_time_from_office_minutes'] = int(row.get('travel_time_from_office_minutes', '0'))
            if row.get('address', '').strip():
                event['address'] = row.get('address', '').strip()
            if row.get('website', '').strip():
                event['website'] = row.get('website', '').strip()
            if row.get('provider', '').strip():
                event['provider'] = row.get('provider', '').strip()
            if row.get('phone', '').strip():
                # Entferne führendes Apostroph (Excel-Textformatierung)
                phone = row.get('phone', '').strip().lstrip("'")
                event['phone'] = phone
            if row.get('email', '').strip():
                event['email'] = row.get('email', '').strip()
            if row.get('travel_time_from_office_minutes_walking', '').strip():
                event['travel_time_from_office_minutes_walking'] = int(row.get('travel_time_from_office_minutes_walking', '0'))
            if row.get('primary_goal', '').strip():
                event['primary_goal'] = row.get('primary_goal', '').strip()
            if row.get('competition_level', '').strip():
                event['competition_level'] = int(row.get('competition_level', '0'))
            if row.get('typical_duration_hours', '').strip():
                # Deutsche Dezimalformate (Komma) in Punkt konvertieren
                duration_str = row.get('typical_duration_hours', '0').replace(',', '.')
                event['typical_duration_hours'] = float(duration_str)
            if row.get('recommended_group_size_min', '').strip():
                event['recommended_group_size_min'] = int(row.get('recommended_group_size_min', '0'))
            if row.get('recommended_group_size_max', '').strip():
                event['recommended_group_size_max'] = int(row.get('recommended_group_size_max', '0'))

            # Validieren
            errors = validate_event(event, row_num)
            if errors:
                all_errors.extend(errors)
                continue

            # Zu Region hinzufügen
            region = event['location_region']
            if region in events_by_region:
                events_by_region[region].append(event)

    if all_errors:
        print("\n=== VALIDIERUNGSFEHLER ===")
        for error in all_errors:
            print(f"  ! {error}")
        print(f"\nGesamt: {len(all_errors)} Fehler gefunden")
        raise ValueError("CSV-Validierung fehlgeschlagen")

    return events_by_region


def format_python_value(value: Any, indent: int = 0) -> str:
    """
    Formatiert einen Python-Wert als String für Code-Generierung.
    """
    indent_str = " " * indent

    if isinstance(value, bool):
        return "True" if value else "False"
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, str):
        # Escape Anführungszeichen und Backslashes
        escaped = value.replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'
    elif isinstance(value, list):
        if not value:
            return "[]"
        # Formatiere Liste über mehrere Zeilen
        items = [format_python_value(item) for item in value]
        return "[" + ", ".join(items) + "]"
    else:
        return repr(value)


def generate_event_dict(event: Dict[str, Any], indent: int = 12) -> str:
    """
    Generiert Python-Code für ein Event-Dictionary.
    """
    indent_str = " " * indent
    lines = [f"{indent_str}dict("]

    # Definiere die Reihenfolge der Felder
    field_order = [
        'title', 'category', 'tags', 'location_region', 'est_price_pp',
        'min_participants', 'accessibility_flags', 'weather_dependent',
        'image_url', 'description', 'season', 'is_mystery',
        'short_description', 'long_description', 'physical_intensity',
        'mental_challenge', 'social_interaction_level', 'price_comment',
        'external_rating', 'lead_time_min_days', 'risk_level',
        'travel_time_from_office_minutes', 'travel_time_from_office_minutes_walking',
        'address', 'website', 'provider', 'phone', 'email',
        'primary_goal', 'competition_level', 'typical_duration_hours',
        'recommended_group_size_min', 'recommended_group_size_max'
    ]

    for field in field_order:
        if field not in event:
            continue

        value = event[field]

        # Überspringe is_mystery wenn False
        if field == 'is_mystery' and not value:
            continue

        # Überspringe description wenn leer (wir nutzen short_description)
        if field == 'description' and not value:
            continue

        # Spezielle Formatierung für category (als EventCategory.xyz)
        if field == 'category':
            if value:  # Nur wenn category vorhanden ist
                lines.append(f"{indent_str}    {field}=EventCategory.{value},")
        # Spezielle Formatierung für primary_goal (als PrimaryGoal.xyz)
        elif field == 'primary_goal':
            if value:  # Nur wenn vorhanden
                lines.append(f"{indent_str}    {field}=PrimaryGoal.{value},")
        # Spezielle Formatierung für Preis und Teilnehmer (als int)
        elif field == 'est_price_pp':
            lines.append(f"{indent_str}    {field}={int(float(value))},")
        elif field == 'min_participants':
            if value:  # Nur wenn vorhanden
                lines.append(f"{indent_str}    {field}={int(value)},")
        # Intensitäts- und Zeit-Felder (als int)
        elif field in ['physical_intensity', 'mental_challenge', 'social_interaction_level',
                      'lead_time_min_days', 'travel_time_from_office_minutes',
                      'travel_time_from_office_minutes_walking', 'competition_level',
                      'recommended_group_size_min', 'recommended_group_size_max']:
            lines.append(f"{indent_str}    {field}={int(value)},")
        # Rating und Duration (als float)
        elif field in ['external_rating', 'typical_duration_hours']:
            lines.append(f"{indent_str}    {field}={float(value)},")
        # Normale Formatierung
        else:
            formatted_value = format_python_value(value)
            lines.append(f"{indent_str}    {field}={formatted_value},")

    lines.append(f"{indent_str}),")

    return "\n".join(lines)


def generate_seeds_by_region_code(events_by_region: Dict[str, List[Dict[str, Any]]]) -> str:
    """
    Generiert den Python-Code für die seeds_by_region Struktur.
    """
    lines = ["    seeds_by_region = {"]

    for region, events in events_by_region.items():
        if not events:
            continue

        lines.append(f'        "{region}": [')

        for event in events:
            event_code = generate_event_dict(event, indent=12)
            # Füge jede Zeile des event_code hinzu
            for line in event_code.split('\n'):
                if line:  # Überspringe leere Zeilen
                    lines.append(line)

        lines.append("        ],")

    lines.append("    }")

    return "\n".join(lines)


def backup_database_file(database_path: Path) -> Path:
    """
    Erstellt ein Backup der database.py Datei.

    Returns:
        Path zum Backup
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = database_path.parent / f"database_backup_{timestamp}.py"

    with open(database_path, 'r', encoding='utf-8') as src:
        content = src.read()

    with open(backup_path, 'w', encoding='utf-8') as dst:
        dst.write(content)

    return backup_path


def replace_seeds_in_database(database_path: Path, new_seeds_code: str) -> None:
    """
    Ersetzt die seeds_by_region Struktur in der database.py.
    """
    with open(database_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern zum Finden der seeds_by_region Struktur
    # Sucht von "seeds_by_region = {" bis zur schließenden "}" auf gleicher Einrückungsebene
    pattern = r'(\s+)seeds_by_region = \{.*?\n\1\}'

    # Prüfe ob Pattern gefunden wird
    if not re.search(pattern, content, re.DOTALL):
        raise ValueError("Konnte seeds_by_region Struktur in database.py nicht finden!")

    # Ersetze die Struktur
    new_content = re.sub(pattern, new_seeds_code, content, flags=re.DOTALL)

    # Schreibe zurück
    with open(database_path, 'w', encoding='utf-8') as f:
        f.write(new_content)


def import_from_csv(csv_path: str, database_path: str = None, create_backup: bool = True) -> None:
    """
    Hauptfunktion: Importiert Events aus CSV und aktualisiert database.py.

    Args:
        csv_path: Pfad zur CSV-Datei
        database_path: Pfad zur database.py (optional, Standard: backend/app/core/database.py)
        create_backup: Ob ein Backup erstellt werden soll
    """
    # Standard-Pfad zur database.py
    if database_path is None:
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        database_path = project_root / "backend" / "app" / "core" / "database.py"
    else:
        database_path = Path(database_path)

    csv_path = Path(csv_path)

    # Validierung
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV-Datei nicht gefunden: {csv_path}")

    if not database_path.exists():
        raise FileNotFoundError(f"database.py nicht gefunden: {database_path}")

    print(f"\n=== Event-Import von CSV nach database.py ===\n")
    print(f"  CSV-Quelle:  {csv_path}")
    print(f"  Ziel:        {database_path}")
    print()

    # Schritt 1: CSV parsen und validieren
    print("[1/4] Parse und validiere CSV-Datei...")
    events_by_region = parse_csv(str(csv_path))

    total_events = sum(len(events) for events in events_by_region.values())
    print(f"      {total_events} Events aus CSV geladen")
    for region, events in events_by_region.items():
        print(f"        - {region}: {len(events)} Events")

    # Schritt 2: Backup erstellen
    if create_backup:
        print("\n[2/4] Erstelle Backup der database.py...")
        backup_path = backup_database_file(database_path)
        print(f"      Backup erstellt: {backup_path.name}")
    else:
        print("\n[2/4] Backup übersprungen (--no-backup)")

    # Schritt 3: Python-Code generieren
    print("\n[3/4] Generiere Python-Code für seeds_by_region...")
    new_seeds_code = generate_seeds_by_region_code(events_by_region)
    code_lines = new_seeds_code.count('\n')
    print(f"      {code_lines} Zeilen Code generiert")

    # Schritt 4: database.py aktualisieren
    print("\n[4/4] Aktualisiere database.py...")
    replace_seeds_in_database(database_path, new_seeds_code)
    print("      database.py erfolgreich aktualisiert")

    print(f"\n[OK] Import abgeschlossen!")
    print(f"     {total_events} Events wurden in database.py importiert")
    if create_backup:
        print(f"     Backup verfügbar unter: {backup_path.name}")
    print()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Importiere Event-Optionen aus CSV in database.py"
    )
    parser.add_argument(
        "csv_file",
        help="Pfad zur CSV-Datei mit Event-Daten"
    )
    parser.add_argument(
        "-d", "--database",
        help="Pfad zur database.py (Standard: backend/app/core/database.py)",
        default=None
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Kein Backup erstellen (nicht empfohlen!)"
    )

    args = parser.parse_args()

    try:
        import_from_csv(
            csv_path=args.csv_file,
            database_path=args.database,
            create_backup=not args.no_backup
        )
    except Exception as e:
        print(f"\n[FEHLER] {str(e)}\n")
        exit(1)
