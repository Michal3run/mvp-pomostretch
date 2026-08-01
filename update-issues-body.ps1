# update-issues-body.ps1
# Zaznacza checkboxy w treści (body) issue dla zakończonych milestone'ów (M1, M2, M3) 
# oraz upewnia się, że są zamknięte.

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
    Write-Host "`n[ERROR] GITHUB_TOKEN not set!" -ForegroundColor Red
    Write-Host 'Set it: $env:GITHUB_TOKEN = "ghp_YourToken"' -ForegroundColor Yellow
    exit 1
}

$script:headers = @{
    "Authorization"        = "Bearer $($env:GITHUB_TOKEN)"
    "Accept"               = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$script:baseUrl = "https://api.github.com/repos/Michal3run/mvp-pomostretch"

function Send-GitHubApi {
    param([string]$Endpoint, [string]$Method = "Get", [string]$JsonBody)
    $uri = "$($script:baseUrl)$Endpoint"
    $params = @{ Uri = $uri; Headers = $script:headers; Method = $Method; ContentType = "application/json; charset=utf-8" }
    if ($JsonBody) {
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    }
    return Invoke-RestMethod @params
}

Write-Host "`n=== Zaznaczam checkboxy (Acceptance Criteria) dla M1, M2, M3 ===" -ForegroundColor Cyan
$issues = Send-GitHubApi -Endpoint "/issues?state=all&per_page=100"

$milestonesToUpdate = @("M1: Database Schema & Exercise Catalog", "M2: Pomodoro Timer", "M3: Break Input & Keyword Matching")

foreach ($issue in $issues) {
    if ($milestonesToUpdate -contains $issue.title) {
        Write-Host "Aktualizuje treść: $($issue.title) (#$($issue.number))..." -NoNewline
        
        # Zamieniamy puste checkboxy na zaznaczone (używamy regexa z opcjonalnymi spacjami)
        $newBody = $issue.body -replace '-\s*\[\s*\]', '- [x]'
        
        $json = @{ body = $newBody; state = "closed" } | ConvertTo-Json -Depth 5
        $null = Send-GitHubApi -Endpoint "/issues/$($issue.number)" -Method Patch -JsonBody $json
        
        Write-Host " OK" -ForegroundColor Green
    }
}

Write-Host "`n=== GOTOWE! ===" -ForegroundColor Cyan
