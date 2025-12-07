# Logs von Development Services anzeigen
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev-logs.ps1 [Service]
# Service kann sein: api, web, oder leer für alle

param(
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

# Navigate to repo root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

if ($Service) {
    Write-Host "=== Logs für $Service ===" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs -f $Service
} else {
    Write-Host "=== Logs für alle Services ===" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs -f
}
