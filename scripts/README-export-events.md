# Event-Daten CSV Export

Dieses Script extrahiert alle Event-Optionen aus der `backend/app/core/database.py` und exportiert sie als CSV-Datei.

## Verwendung

### Windows (PowerShell)
```powershell
.\scripts\export-events.ps1
```

### Direkt mit Python
```bash
# Standard-Output: event-options-export.csv
python scripts/export_events_to_csv.py

# Eigener Dateiname
python scripts/export_events_to_csv.py -o meine-events.csv
```

## CSV-Format

Die exportierte CSV-Datei enthält folgende Spalten:

| Spalte | Beschreibung | Beispiel |
|--------|--------------|----------|
| `title` | Event-Titel | "Cyber-Artists & Steel City" |
| `category` | Kategorie | "action", "relax", "food", "party" |
| `tags` | Kommaseparierte Tags | "digital, art, innovation, urban" |
| `location_region` | Region | "OOE", "Tirol", "Sbg", "Stmk", "Ktn" |
| `est_price_pp` | Geschätzter Preis pro Person (€) | 80 |
| `min_participants` | Minimale Teilnehmerzahl | 8 |
| `accessibility_flags` | Barrierefreiheit | "wheelchair" |
| `weather_dependent` | Wetterabhängig | "Ja" oder "Nein" |
| `season` | Saison | "all_year", "summer", "winter" |
| `description` | Beschreibung | "Vormittags Highlight-Führung..." |
| `image_url` | Bild-URL | "https://images.unsplash.com/..." |
| `is_mystery` | Mystery-Event | "Ja" oder "Nein" |

## Technische Details

- **Encoding**: UTF-8 with BOM (Excel-kompatibel)
- **Delimiter**: Semikolon (`;`)
- **Zeilen**: Header + 36 Events (Stand: aktuell)
- **Regionen**: OOE (8), Tirol (7), Sbg (7), Stmk (7), Ktn (7)

## Hinweise

- Die CSV-Datei kann direkt in Excel, Google Sheets oder anderen Tabellenkalkulationen geöffnet werden
- Listen (Tags, Accessibility Flags) werden als kommaseparierte Werte exportiert
- Das Script benötigt **keine Backend-Dependencies** (SQLAlchemy, etc.)
- Bei Änderungen in `backend/app/core/database.py` muss das Script manuell aktualisiert werden

## Beispiel-Output

```csv
title;category;tags;location_region;est_price_pp;min_participants;accessibility_flags;weather_dependent;season;description;image_url;is_mystery
Cyber-Artists & Steel City;relax;digital, art, innovation, urban;OOE;80;8;wheelchair;Nein;all_year;Vormittags Highlight-Führung...;https://...;Nein
```

## Weiterverarbeitung

Die exportierte CSV kann verwendet werden für:
- Datenanalyse und Reporting
- Import in andere Systeme
- Bearbeitung und Überprüfung der Event-Daten
- Erstellung von Marketing-Materialien
- Preiskalkulationen und Budget-Planung
