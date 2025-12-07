# Lokales Development mit Docker Compose starten
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev-start.ps1 [-Build]

param(
    [switch]$Build
)

$ErrorActionPreference = "Stop"

Write-Host "=== EventHorizon Local Development ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker ist nicht verfügbar. Bitte starte Docker Desktop." -ForegroundColor Red
    exit 1
}

# Navigate to repo root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

# Ensure .env.local files exist
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "WARNING: frontend\.env.local nicht gefunden. Erstelle aus .env.local.example..." -ForegroundColor Yellow
    if (Test-Path "frontend\.env.local.example") {
        Copy-Item "frontend\.env.local.example" "frontend\.env.local"
    }
}

if (-not (Test-Path "backend\.env.local")) {
    Write-Host "WARNING: backend\.env.local nicht gefunden. Erstelle aus .env.local.example..." -ForegroundColor Yellow
    if (Test-Path "backend\.env.local.example") {
        Copy-Item "backend\.env.local.example" "backend\.env.local"
    }
}

Write-Host "Starte Services mit Docker Compose..." -ForegroundColor Green
Write-Host ""

if ($Build) {
    Write-Host "Building images..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up --build -d
} else {
    docker compose -f docker-compose.dev.yml up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Compose konnte nicht gestartet werden." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Services gestartet! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:    http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Health:  http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "API Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs anzeigen:     docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
Write-Host "Services stoppen:  docker compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
Write-Host ""
Write-Host "Hot Reload ist aktiviert - Code-Änderungen werden automatisch übernommen!" -ForegroundColor Green
