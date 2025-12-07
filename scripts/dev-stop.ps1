# Lokales Development stoppen
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev-stop.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Stoppe EventHorizon Development Services ===" -ForegroundColor Cyan

# Navigate to repo root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

docker compose -f docker-compose.dev.yml down

Write-Host ""
Write-Host "Services gestoppt!" -ForegroundColor Green
