# Run frontend and backend (with venv) on Windows
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-app.ps1 [-SkipInstall]

param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

# Repo root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..")
Set-Location $repoRoot
$frontendPath = Join-Path $repoRoot "frontend"

# Frontend dependencies
if (-not $SkipInstall) {
  Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Cyan
  Push-Location $frontendPath
  npm install
  Pop-Location
}

# Backend venv + deps
$venvPath = Join-Path $repoRoot "backend\.venv"
if (-not (Test-Path $venvPath)) {
  Write-Host "Creating backend venv..." -ForegroundColor Cyan
  python -m venv $venvPath
}
$venvPython = Join-Path $venvPath "Scripts\python.exe"
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $repoRoot "backend\requirements.txt")

# Start backend
$backendCmd = "cd `"$repoRoot\backend`"; ..\backend\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"
Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Start frontend
$frontendCmd = "cd `"$frontendPath`"; npm run dev"
Write-Host "Starting frontend on http://localhost:8080 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "`nAPI health: http://localhost:8000/api/health" -ForegroundColor Yellow
Write-Host "Frontend:   http://localhost:8080/" -ForegroundColor Yellow
