# update-roadmap-issues.ps1
# Closes GitHub issues for completed milestones (M1, M2, M3)
# Uses GitHub REST API via Invoke-RestMethod

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

Write-Host "`n=== Fetching Open Issues ===" -ForegroundColor Cyan
$issues = Send-GitHubApi -Endpoint "/issues?state=open&per_page=100"

$milestonesToClose = @("M1: Database Schema & Exercise Catalog", "M2: Pomodoro Timer", "M3: Break Input & Keyword Matching")

foreach ($issue in $issues) {
    if ($milestonesToClose -contains $issue.title) {
        Write-Host "Closing $($issue.title) (#$($issue.number))..." -NoNewline
        $json = @{ state = "closed" } | ConvertTo-Json
        $null = Send-GitHubApi -Endpoint "/issues/$($issue.number)" -Method Patch -JsonBody $json
        
        # Add the 'complete' label as well
        $labels = $issue.labels | Select-Object -ExpandProperty name
        if ($labels -notcontains "complete") {
            $labels += "complete"
            $jsonLabels = @{ labels = $labels } | ConvertTo-Json
            $null = Send-GitHubApi -Endpoint "/issues/$($issue.number)" -Method Patch -JsonBody $jsonLabels
        }
        
        Write-Host " OK" -ForegroundColor Green
    }
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
