# Event-Daten CSV Import

Dieses Script importiert Event-Optionen aus einer CSV-Datei und ersetzt die `seeds_by_region` Struktur in `backend/app/core/database.py`.

## ⚠️ WARNUNG

**Dieser Vorgang überschreibt die Event-Daten in der database.py!**

- Ein automatisches Backup wird standardmäßig erstellt
- Die CSV-Daten werden validiert vor dem Import
- Bei Fehlern wird der Import abgebrochen

## Verwendung

### Windows (PowerShell) - Empfohlen
```powershell
# Mit Standard-CSV-Datei (event-options-export.csv)
.\scripts\import-events.ps1

# Mit eigener CSV-Datei
.\scripts\import-events.ps1 -CsvFile "meine-events.csv"

# Ohne Backup (NICHT EMPFOHLEN!)
.\scripts\import-events.ps1 -NoBackup
```

### Direkt mit Python
```bash
# Standard: Backup wird erstellt
python scripts/import_events_from_csv.py event-options-export.csv

# Mit eigenem Pfad zur database.py
python scripts/import_events_from_csv.py events.csv -d backend/app/core/database.py

# Ohne Backup (NICHT EMPFOHLEN!)
python scripts/import_events_from_csv.py events.csv --no-backup
```

## CSV-Format

Die CSV-Datei muss folgende Struktur haben:

### Erforderliche Spalten (Pflichtfelder)

| Spalte | Typ | Beschreibung | Beispiel |
|--------|-----|--------------|----------|
| `title` | Text | Event-Titel | "Cyber-Artists & Steel City" |
| `category` | Text | Kategorie | "action", "relax", "food", "party" |
| `location_region` | Text | Region | "OOE", "Tirol", "Sbg", "Stmk", "Ktn" |
| `est_price_pp` | Zahl | Preis pro Person (€) | 80 |
| `min_participants` | Zahl | Minimale Teilnehmer | 8 |
| `season` | Text | Saison | "all_year", "summer", "winter" |
| `description` | Text | Beschreibung | "Vormittags..." |

### Optionale Spalten

| Spalte | Typ | Beschreibung | Format |
|--------|-----|--------------|--------|
| `tags` | Liste | Tags | "digital, art, innovation" (kommasepariert) |
| `accessibility_flags` | Liste | Barrierefreiheit | "wheelchair, vegan" (kommasepariert) |
| `weather_dependent` | Boolean | Wetterabhängig | "Ja", "Nein", "true", "false" |
| `image_url` | URL | Bild-URL | "https://..." |
| `is_mystery` | Boolean | Mystery-Event | "Ja", "Nein", "true", "false" |

### CSV-Einstellungen

- **Encoding**: UTF-8 with BOM (Excel-kompatibel)
- **Delimiter**: Semikolon (`;`)
- **Erste Zeile**: Header-Zeile mit Spaltennamen

## Validierung

Das Script validiert automatisch:

✅ **Pflichtfelder**: Alle erforderlichen Felder müssen ausgefüllt sein
✅ **Kategorien**: Nur "action", "relax", "food", "party" erlaubt
✅ **Regionen**: Nur "OOE", "Tirol", "Sbg", "Stmk", "Ktn" erlaubt
✅ **Saison**: Nur "all_year", "summer", "winter" erlaubt
✅ **Numerische Werte**: Preis und Teilnehmer müssen gültige Zahlen > 0 sein

Bei Validierungsfehlern wird der Import **abgebrochen** und alle Fehler werden angezeigt.

## Ablauf

### 1. CSV-Validierung
```
[1/4] Parse und validiere CSV-Datei...
      36 Events aus CSV geladen
        - OOE: 8 Events
        - Tirol: 7 Events
        - Sbg: 7 Events
        - Stmk: 7 Events
        - Ktn: 7 Events
```

### 2. Backup erstellen
```
[2/4] Erstelle Backup der database.py...
      Backup erstellt: database_backup_20250107_143022.py
```

Das Backup wird im gleichen Verzeichnis wie `database.py` gespeichert.

### 3. Code-Generierung
```
[3/4] Generiere Python-Code für seeds_by_region...
      479 Zeilen Code generiert
```

Das Script generiert korrekten Python-Code mit:
- Richtiger Einrückung (PEP 8)
- EventCategory-Enums
- Escaped Strings
- Korrekte Listen-Syntax

### 4. Update database.py
```
[4/4] Aktualisiere database.py...
      database.py erfolgreich aktualisiert
```

Die `seeds_by_region` Struktur wird durch Regex-Pattern gefunden und ersetzt.

## Nach dem Import

Nach erfolgreichem Import:

1. **Backend neu starten**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Optional: Datenbank zurücksetzen**
   ```sql
   DELETE FROM eventoption;
   ```
   Die Events werden beim nächsten Backend-Start automatisch neu geseeded.

3. **Testen**
   - Frontend aufrufen: `http://localhost:8080`
   - Aktivitäten-Tab in Campaign-Detail überprüfen
   - Filter und Suche testen

## Fehlerbehandlung

### Validierungsfehler
```
=== VALIDIERUNGSFEHLER ===
  ! Zeile 5: Pflichtfeld 'title' fehlt oder ist leer
  ! Zeile 12: Ungültige Kategorie 'sport'. Erlaubt: action, relax, food, party
  ! Zeile 23: Ungültiger Preis 'abc'

Gesamt: 3 Fehler gefunden

[FEHLER] CSV-Validierung fehlgeschlagen
```

➡️ **Lösung**: CSV-Datei korrigieren und erneut versuchen

### Pattern nicht gefunden
```
[FEHLER] Konnte seeds_by_region Struktur in database.py nicht finden!
```

➡️ **Lösung**: Datei `backend/app/core/database.py` wurde möglicherweise umstrukturiert

### CSV-Datei nicht gefunden
```
[FEHLER] CSV-Datei nicht gefunden: events.csv
```

➡️ **Lösung**: Pfad zur CSV-Datei überprüfen

## Backup wiederherstellen

Falls etwas schief geht:

```bash
# Finde das Backup
ls backend/app/core/database_backup_*.py

# Stelle wieder her
cp backend/app/core/database_backup_20250107_143022.py backend/app/core/database.py
```

Oder mit Git:
```bash
git checkout backend/app/core/database.py
```

## Workflow: Export → Bearbeiten → Import

### Typischer Workflow

1. **Events exportieren**
   ```powershell
   .\scripts\export-events.ps1
   ```

2. **CSV in Excel bearbeiten**
   - Öffne `event-options-export.csv` in Excel
   - Bearbeite Events (neue hinzufügen, ändern, löschen)
   - Als CSV speichern (UTF-8, Semikolon)

3. **Events importieren**
   ```powershell
   .\scripts\import-events.ps1 -CsvFile "event-options-export.csv"
   ```

4. **Backend neu starten**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

## Technische Details

### Regex-Pattern
Das Script verwendet folgendes Pattern zum Finden der seeds_by_region Struktur:

```python
pattern = r'(\s+)seeds_by_region = \{.*?\n\1\}'
```

Dies findet die gesamte Dictionary-Struktur basierend auf Einrückungstiefe.

### Code-Generierung
Events werden als Python-Dictionaries generiert:

```python
dict(
    title="Cyber-Artists & Steel City",
    category=EventCategory.relax,
    tags=["digital", "art", "innovation", "urban"],
    location_region="OOE",
    est_price_pp=80,
    min_participants=8,
    accessibility_flags=["wheelchair"],
    weather_dependent=False,
    image_url="https://...",
    description="...",
    season="all_year",
),
```

### Besonderheiten

- **String-Escaping**: Anführungszeichen und Backslashes werden korrekt escaped
- **Boolean-Werte**: Werden als Python `True`/`False` geschrieben
- **Listen**: Werden als Python-Listen `[]` formatiert
- **is_mystery**: Wird nur hinzugefügt wenn `True`

## Beispiel CSV

```csv
title;category;tags;location_region;est_price_pp;min_participants;accessibility_flags;weather_dependent;season;description;image_url;is_mystery
Cyber-Artists & Steel City;relax;digital, art, innovation, urban;OOE;80;8;wheelchair;Nein;all_year;Vormittags Highlight-Führung...;https://...;Nein
E-Mobility Grand Prix;action;racing, e-kart, competition, tech;OOE;70;10;wheelchair;Nein;all_year;Exklusive Bahnmiete...;https://...;Nein
```

## Häufige Probleme

### Problem: Excel ändert Encoding
**Lösung**: "Speichern unter" → "CSV UTF-8 (durch Trennzeichen getrennt)" wählen

### Problem: Semikolon wird nicht als Delimiter erkannt
**Lösung**: In Excel unter "Datei → Optionen → Erweitert → Trennzeichen vom Betriebssystem übernehmen" deaktivieren

### Problem: Umlaute werden falsch dargestellt
**Lösung**: CSV mit UTF-8 BOM Encoding speichern

### Problem: Import schlägt fehl mit Python-Syntaxfehler
**Lösung**:
1. Backup wiederherstellen
2. CSV-Daten auf Sonderzeichen prüfen (z.B. unescaped Quotes)
3. Erneut importieren

## Sicherheitshinweise

✅ **DO**:
- Immer Backup erstellen lassen
- CSV-Daten vor Import validieren
- Nach Import testen
- Git verwenden für Versionskontrolle

❌ **DON'T**:
- `--no-backup` verwenden (außer für Tests)
- Unvalidierte CSV-Dateien importieren
- database.py manuell bearbeiten während Import läuft
- Mehrere Imports gleichzeitig durchführen
