$Token = Read-Host -Prompt "Enter your GitHub Personal Access Token"
$Repo = "Michal3run/mvp-pomostretch"
$Issues = @(5, 6, 7)

$Headers = @{
    "Accept" = "application/vnd.github+json"
    "Authorization" = "Bearer $Token"
    "X-GitHub-Api-Version" = "2022-11-28"
}

foreach ($Issue in $Issues) {
    Write-Host "Updating Issue #$Issue..." -ForegroundColor Cyan

    # 1. Add a comment explaining the resolution
    $CommentBody = @{ body = "Implemented and resolved in MVP v1." } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/issues/$Issue/comments" `
                      -Method Post `
                      -Headers $Headers `
                      -Body $CommentBody `
                      -ContentType "application/json" | Out-Null
    
    Write-Host "  - Added resolution comment."

    # 2. Update the issue state to closed
    $PatchBody = @{ state = "closed"; state_reason = "completed" } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/issues/$Issue" `
                      -Method Patch `
                      -Headers $Headers `
                      -Body $PatchBody `
                      -ContentType "application/json" | Out-Null

    Write-Host "  - Issue #$Issue successfully closed." -ForegroundColor Green
}

Write-Host "All specified issues have been updated and closed!" -ForegroundColor Green
