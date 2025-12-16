# PowerShell script to clear Vite cache
# Run this if you encounter Vite dependency optimization errors

Write-Host "Clearing Vite cache..." -ForegroundColor Yellow

$cacheDirs = @(
    "node_modules\.vite",
    ".vite",
    "node_modules\.vite\deps_temp_*"
)

$cleared = $false
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "  [OK] Cleared $dir" -ForegroundColor Green
        $cleared = $true
    }
}

# Also clear any temp directories matching the pattern
Get-ChildItem -Path "node_modules\.vite" -Filter "deps_temp_*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
    Write-Host "  [OK] Cleared $($_.Name)" -ForegroundColor Green
    $cleared = $true
}

if (-not $cleared) {
    Write-Host "  [INFO] No Vite cache directories found" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Vite cache cleared! Restart the dev server." -ForegroundColor Green
}

