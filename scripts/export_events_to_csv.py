"""
Export Event Options from database.py to CSV
Extrahiert alle Event-Einträge direkt aus backend/app/core/database.py und exportiert sie als CSV.
"""

import csv
import re
from pathlib import Path
from typing import Dict, List, Any


def extract_seeds_from_database_py(database_path: Path) -> Dict[str, List[Dict[str, Any]]]:
    """
    Extrahiert die seeds_by_region Struktur direkt aus database.py.

    Args:
        database_path: Pfad zur database.py Datei

    Returns:
        Dictionary mit Region -> Liste von Events
    """
    with open(database_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Finde die seeds_by_region Struktur mit Regex
    pattern = r'seeds_by_region\s*=\s*\{(.*?)\n    \}'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        raise ValueError("Konnte seeds_by_region Struktur in database.py nicht finden!")

    # Extrahiere die komplette Dictionary-Struktur
    seeds_code = "seeds_by_region = {" + match.group(1) + "\n    }"

    # Ersetze EventCategory.xyz mit Strings
    seeds_code = re.sub(r'EventCategory\.(\w+)', r'"\1"', seeds_code)

    # Erstelle einen sicheren Namespace für eval
    namespace = {
        '__builtins__': {},
        'dict': dict,
        'True': True,
        'False': False,
    }

    # Führe den Code aus, um die Datenstruktur zu erhalten
    exec(seeds_code, namespace)
    seeds_by_region = namespace['seeds_by_region']

    return seeds_by_region


def get_event_data(database_path: Path = None):
    """
    Extrahiert die Event-Daten direkt aus backend/app/core/database.py.

    Args:
        database_path: Pfad zur database.py (optional, Standard: backend/app/core/database.py)

    Returns:
        Liste aller Events aus allen Regionen
    """
    # Standard-Pfad zur database.py
    if database_path is None:
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        database_path = project_root / "backend" / "app" / "core" / "database.py"

    if not database_path.exists():
        raise FileNotFoundError(f"database.py nicht gefunden: {database_path}")

    print(f"Lese Events aus: {database_path}")

    # Extrahiere seeds_by_region aus database.py
    seeds_by_region = extract_seeds_from_database_py(database_path)

    # Flatten all events from all regions
    all_events = []
    for region, events in seeds_by_region.items():
        all_events.extend(events)

    return all_events


def export_to_csv(output_path: str = "events_export.csv", database_path: Path = None):
    """
    Exportiert alle Events in eine CSV-Datei.

    Args:
        output_path: Pfad zur Output-CSV-Datei
        database_path: Pfad zur database.py (optional)
    """
    events = get_event_data(database_path)

    if not events:
        print("Keine Events gefunden!")
        return

    # CSV Header definieren
    fieldnames = [
        "title",
        "category",
        "tags",
        "location_region",
        "est_price_pp",
        "min_participants",
        "accessibility_flags",
        "weather_dependent",
        "season",
        "description",
        "image_url",
        "is_mystery",
        "short_description",
        "long_description",
        "physical_intensity",
        "mental_challenge",
        "social_interaction_level",
        "price_comment",
        "external_rating",
        "lead_time_min_days",
        "risk_level",
        "travel_time_from_office_minutes",
        "address",
        "website",
        "provider",
        "phone",
        "email"
    ]

    # CSV-Datei schreiben
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=';')

        writer.writeheader()

        for event in events:
            # Konvertiere Listen zu kommaseparierten Strings
            row = {
                "title": event.get("title", ""),
                "category": str(event.get("category", "")),
                "tags": ", ".join(event.get("tags", [])),
                "location_region": event.get("location_region", ""),
                "est_price_pp": event.get("est_price_pp", 0),
                "min_participants": event.get("min_participants", 0),
                "accessibility_flags": ", ".join(event.get("accessibility_flags", [])),
                "weather_dependent": "Ja" if event.get("weather_dependent", False) else "Nein",
                "season": event.get("season", ""),
                "description": event.get("description", ""),
                "image_url": event.get("image_url", ""),
                "is_mystery": "Ja" if event.get("is_mystery", False) else "Nein",
                "short_description": event.get("short_description", ""),
                "long_description": event.get("long_description", ""),
                "physical_intensity": event.get("physical_intensity", ""),
                "mental_challenge": event.get("mental_challenge", ""),
                "social_interaction_level": event.get("social_interaction_level", ""),
                "price_comment": event.get("price_comment", ""),
                "external_rating": event.get("external_rating", ""),
                "lead_time_min_days": event.get("lead_time_min_days", ""),
                "risk_level": event.get("risk_level", ""),
                "travel_time_from_office_minutes": event.get("travel_time_from_office_minutes", ""),
                "address": event.get("address", ""),
                "website": event.get("website", ""),
                "provider": event.get("provider", ""),
                "phone": event.get("phone", ""),
                "email": event.get("email", "")
            }

            writer.writerow(row)

    print(f"[OK] {len(events)} Events erfolgreich nach '{output_path}' exportiert!")
    print(f"     Regionen: OOE, Tirol, Sbg, Stmk, Ktn")
    print(f"     Encoding: UTF-8 with BOM (Excel-kompatibel)")
    print(f"     Delimiter: Semikolon (;)")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Exportiere Event-Optionen aus database.py zu CSV"
    )
    parser.add_argument(
        "-o", "--output",
        default="events_export.csv",
        help="Output CSV-Datei (Standard: events_export.csv)"
    )
    parser.add_argument(
        "-d", "--database",
        help="Pfad zur database.py (Standard: backend/app/core/database.py)",
        default=None
    )

    args = parser.parse_args()

    database_path = Path(args.database) if args.database else None
    export_to_csv(args.output, database_path)
