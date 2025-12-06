# Run the stack via docker-compose on Windows
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-docker.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot

Write-Host "Starting docker-compose services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "`nServices starting:" -ForegroundColor Yellow
Write-Host " API: http://localhost:8000/api/health" -ForegroundColor Yellow
Write-Host " Frontend (vite): http://localhost:8080/" -ForegroundColor Yellow
Write-Host "`nUse 'docker-compose logs -f' to follow logs, 'docker-compose down' to stop." -ForegroundColor DarkGray
