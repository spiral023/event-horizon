# Simple connectivity test against OpenRouter using CURL
# Usage: powershell -ExecutionPolicy Bypass -File scripts/test-openrouter.ps1 [-ApiKey "sk-or-..."] [-Model "gpt-4.1-mini"]
# Defaults are read from backend/.env (OPENROUTER_API_KEY, LLM_MODEL).

param(
  [string]$ApiKey,
  [string]$Model
)

$ErrorActionPreference = "Stop"

# load .env from backend/.env
$root = Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..")
$envPath = Join-Path $root "backend\.env"
$envFileValues = @{}
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }
    $parts = $_ -split "=",2
    if ($parts.Length -eq 2) {
      $key = $parts[0].Trim()
      $val = $parts[1].Trim()
      $envFileValues[$key] = $val
    }
  }
}

# Preference order: explicit param > .env file > current env > fallback
if (-not $ApiKey) { $ApiKey = $envFileValues['OPENROUTER_API_KEY'] }
if (-not $ApiKey) { $ApiKey = $Env:OPENROUTER_API_KEY }
if (-not $Model) { $Model = $envFileValues['LLM_MODEL'] }
if (-not $Model) { $Model = $Env:LLM_MODEL }

if (-not $ApiKey) {
  Write-Host "API-Key fehlt. Setze -ApiKey oder trage OPENROUTER_API_KEY in backend/.env ein." -ForegroundColor Red
  exit 1
}
if (-not $Model) { $Model = "gpt-4.1-mini" }

$headers = @{
  "Authorization" = "Bearer $ApiKey"
  "Content-Type"  = "application/json"
}

$body = @{
  "model" = $Model
  "messages" = @(
    @{
      "role" = "user"
      "content" = "Ping from TeamVote OpenRouter connectivity test."
    }
  )
} | ConvertTo-Json -Depth 5

Write-Host "Sending test request to OpenRouter..." -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest -Uri "https://openrouter.ai/api/v1/chat/completions" `
    -Method Post -Headers $headers -Body $body
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Response snippet:" -ForegroundColor Yellow
  $json = $response.Content | ConvertFrom-Json
  $reply = $json.choices[0].message.content
  Write-Output $reply
} catch {
  Write-Host "Request failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
}
