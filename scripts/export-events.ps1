# PowerShell Script zum Exportieren der Event-Daten als CSV
# Verwendung: .\scripts\export-events.ps1

Write-Host "🚀 Event-Daten Export wird gestartet..." -ForegroundColor Cyan
Write-Host ""

# Zum Projekt-Root wechseln
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Python-Script ausführen
Write-Host "📊 Exportiere Events aus database.py..." -ForegroundColor Yellow
python scripts\export_events_to_csv.py -o "event-options-export.csv"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✨ Export erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "   Datei: event-options-export.csv" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📁 Datei öffnen? (j/n): " -NoNewline -ForegroundColor Cyan
    $response = Read-Host

    if ($response -eq 'j' -or $response -eq 'J' -or $response -eq 'y' -or $response -eq 'Y') {
        Start-Process "event-options-export.csv"
    }
} else {
    Write-Host ""
    Write-Host "❌ Fehler beim Export!" -ForegroundColor Red
    Write-Host "   Überprüfen Sie, ob Python installiert ist und alle Dependencies vorhanden sind." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Drücken Sie eine beliebige Taste zum Beenden..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
