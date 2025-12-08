# PowerShell Script zum Importieren der Event-Daten aus CSV
# Verwendung: .\scripts\import-events.ps1 [-CsvFile "pfad/zur/datei.csv"] [-NoBackup]

param(
    [string]$CsvFile = "event-options-export.csv",
    [switch]$NoBackup
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Event-Import: CSV -> database.py" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Zum Projekt-Root wechseln
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Prüfe ob CSV-Datei existiert
if (-not (Test-Path $CsvFile)) {
    Write-Host "[FEHLER] CSV-Datei nicht gefunden: $CsvFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verfügbare CSV-Dateien im aktuellen Verzeichnis:" -ForegroundColor Yellow
    Get-ChildItem -Filter *.csv | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Verwendung: .\scripts\import-events.ps1 -CsvFile 'meine-datei.csv'" -ForegroundColor Gray
    Write-Host ""
    pause
    exit 1
}

Write-Host "CSV-Datei gefunden: $CsvFile" -ForegroundColor Green
Write-Host ""

# Warnung anzeigen
Write-Host "WARNUNG: Dieser Vorgang wird die Event-Einträge in" -ForegroundColor Yellow
Write-Host "         backend\app\core\database.py ERSETZEN!" -ForegroundColor Yellow
Write-Host ""

if (-not $NoBackup) {
    Write-Host "Ein Backup wird automatisch erstellt." -ForegroundColor Cyan
} else {
    Write-Host "ACHTUNG: Kein Backup wird erstellt (--NoBackup)!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Möchten Sie fortfahren? (j/n): " -NoNewline -ForegroundColor Cyan
$response = Read-Host

if ($response -ne 'j' -and $response -ne 'J' -and $response -ne 'y' -and $response -ne 'Y') {
    Write-Host ""
    Write-Host "Import abgebrochen." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 0
}

Write-Host ""
Write-Host "Starte Import..." -ForegroundColor Cyan
Write-Host ""

# Python-Script ausführen
$arguments = @($CsvFile)
if ($NoBackup) {
    $arguments += "--no-backup"
}

python scripts\import_events_from_csv.py @arguments

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  Import erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Die database.py wurde aktualisiert." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Nächste Schritte:" -ForegroundColor Cyan
    Write-Host "  1. Backend neu starten (damit die Änderungen wirksam werden)" -ForegroundColor Gray
    Write-Host "  2. Datenbank überprüfen (optional: DELETE FROM eventoption)" -ForegroundColor Gray
    Write-Host "  3. Backend startet und seeded die neuen Events automatisch" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "  Import fehlgeschlagen!" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bitte überprüfen Sie die Fehlermeldungen oben." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Drücken Sie eine beliebige Taste zum Beenden..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
