# Rebuild Frontend Container nach Code-Änderungen
# Usage: powershell -ExecutionPolicy Bypass -File scripts/rebuild-frontend.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== EventHorizon Frontend Rebuild ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to repo root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker ist nicht verfügbar. Bitte starte Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "1/4 Stoppe laufende Container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml down

Write-Host ""
Write-Host "2/4 Baue Frontend-Container neu (mit neuen Dateien)..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml build --no-cache web

Write-Host ""
Write-Host "3/4 Starte alle Services..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "4/4 Warte auf Service-Start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== Frontend erfolgreich neu gebaut! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:    http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "WICHTIG: " -ForegroundColor Yellow -NoNewline
Write-Host "Leere deinen Browser-Cache (Strg+Shift+R / Cmd+Shift+R)" -ForegroundColor White
Write-Host ""
Write-Host "Logs anzeigen:    powershell -File scripts/dev-logs.ps1" -ForegroundColor Magenta
Write-Host "Services stoppen: docker compose -f docker-compose.dev.yml down" -ForegroundColor Magenta
Write-Host ""

# Optional: Show logs
$response = Read-Host "Möchtest du die Logs sehen? (j/n)"
if ($response -eq "j" -or $response -eq "J") {
    Write-Host ""
    Write-Host "Zeige Logs (Strg+C zum Beenden)..." -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs -f web
}
