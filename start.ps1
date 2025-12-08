# Verolux Management System - Start Script for Windows (PowerShell)
# This script starts both backend and frontend servers

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verolux Management System - Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check for ngrok flag
$UseNgrok = $false
if ($args -contains "--ngrok" -or $args -contains "-n") {
    $UseNgrok = $true
}

# Stop existing processes
Write-Host "[*] Stopping existing processes..." -ForegroundColor Yellow

# Stop processes on port 8000
$backendProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $backendProcesses) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Stop processes on port 5173
$frontendProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $frontendProcesses) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Stop ngrok
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2
Write-Host "[OK] Processes stopped" -ForegroundColor Green
Write-Host ""

# Get local IP address
$IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $IP) {
    $IP = "192.168.0.160"
}

# Start Backend
Write-Host "[*] Starting Backend..." -ForegroundColor Yellow
Set-Location "$ScriptDir\backend"

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "[*] Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        Write-Host "        Make sure Python is installed: python --version"
        Set-Location $ScriptDir
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    & "venv\Scripts\pip.exe" install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Set-Location $ScriptDir
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] Virtual environment created and dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[*] Virtual environment found" -ForegroundColor Green
}

# Check if venv Python exists
$venvPython = "$ScriptDir\backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "[ERROR] Virtual environment Python not found" -ForegroundColor Red
    Write-Host "        Recreate venv: Remove-Item -Recurse -Force venv; python -m venv venv"
    Set-Location $ScriptDir
    Read-Host "Press Enter to exit"
    exit 1
}

# Start backend with activated venv
Write-Host "[*] Starting backend server..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath $venvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden
Set-Location $ScriptDir
Start-Sleep -Seconds 3

# Check if backend started
$backendRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "[OK] Backend started on port 8000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend failed to start" -ForegroundColor Red
    Write-Host "Check if virtual environment is properly set up"
    Write-Host "Try: cd backend && python -m venv venv && venv\Scripts\pip.exe install -r requirements.txt"
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Frontend
Write-Host "[*] Starting Frontend..." -ForegroundColor Yellow
Set-Location "$ScriptDir\frontend\web"

# Clear Vite cache
Write-Host "[*] Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
}
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite" -ErrorAction SilentlyContinue
}
Write-Host "[OK] Cache cleared" -ForegroundColor Green
Write-Host ""

# Verify configuration
Write-Host "[*] Verifying configuration..." -ForegroundColor Yellow

# Check client.ts
if ((Get-Content "src\api\client.ts" -Raw) -match 'return "/api"') {
    Write-Host "[OK] client.ts uses relative /api path" -ForegroundColor Green
} else {
    Write-Host "[WARNING] client.ts may not have the fix applied" -ForegroundColor Yellow
}

# Check vite.config.ts proxy
if ((Get-Content "vite.config.ts" -Raw) -match "proxy:") {
    Write-Host "[OK] vite.config.ts has proxy configured" -ForegroundColor Green
} else {
    Write-Host "[WARNING] vite.config.ts may not have proxy configured" -ForegroundColor Yellow
}

# Check .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'VITE_API_BASE_URL.*http://' -or $envContent -match 'VITE_API_BASE_URL.*192\.168') {
        Write-Host "[WARNING] .env contains hardcoded IP address" -ForegroundColor Yellow
        Write-Host "          Remove VITE_API_BASE_URL from .env or set it to: VITE_API_BASE_URL=/api"
    } else {
        Write-Host "[OK] .env file is OK" -ForegroundColor Green
    }
} else {
    Write-Host "[OK] No .env file (using default relative /api path)" -ForegroundColor Green
}
Write-Host ""

# Start frontend
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "vite", "--host", "0.0.0.0", "--port", "5173" -WindowStyle Hidden
Set-Location $ScriptDir
Start-Sleep -Seconds 5

# Check if frontend started
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "[OK] Frontend started on port 5173" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend failed to start" -ForegroundColor Red
    Write-Host "Check if Node.js is installed and dependencies are installed (npm install)"
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for services to be ready
Start-Sleep -Seconds 2

# Verify services
Write-Host ""
Write-Host "[*] Verifying services..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Backend is responding" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend may not be ready yet" -ForegroundColor Yellow
}

# Check if HTTPS certificates exist
$frontendProto = "http"
if ((Test-Path "frontend\web\certs\cert.pem") -and (Test-Path "frontend\web\certs\key.pem")) {
    $frontendProto = "https"
}

try {
    $response = Invoke-WebRequest -Uri "$frontendProto://localhost:5173" -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
    Write-Host "[OK] Frontend is responding" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Frontend may not be ready yet" -ForegroundColor Yellow
}
Write-Host ""

# Start ngrok if requested
if ($UseNgrok) {
    Write-Host "[*] Starting ngrok tunnel..." -ForegroundColor Yellow
    
    # Check if ngrok is installed
    $ngrokCmd = $null
    if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
        $ngrokCmd = "ngrok"
    } elseif (Test-Path "$ScriptDir\ngrok.exe") {
        $ngrokCmd = "$ScriptDir\ngrok.exe"
    }
    
    if (-not $ngrokCmd) {
        Write-Host "[ERROR] ngrok is not installed" -ForegroundColor Red
        Write-Host "        Download from: https://ngrok.com/download"
        Write-Host ""
        $UseNgrok = $false
    } else {
        # Kill existing ngrok
        Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Start ngrok
        if ($frontendProto -eq "https") {
            Start-Process -NoNewWindow -FilePath $ngrokCmd -ArgumentList "http", "https://localhost:5173" -WindowStyle Hidden
        } else {
            Start-Process -NoNewWindow -FilePath $ngrokCmd -ArgumentList "http", "5173" -WindowStyle Hidden
        }
        
        Start-Sleep -Seconds 8
        Write-Host "[OK] ngrok tunnel started" -ForegroundColor Green
        Write-Host "     Check ngrok web interface: http://localhost:4040"
        Write-Host ""
    }
}

# Display access URLs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  System Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access URLs:"
Write-Host "  Backend:  http://$IP:8000"
Write-Host "  Frontend: $frontendProto://$IP:5173"
Write-Host ""
Write-Host "From Computer:"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "  Frontend: $frontendProto://localhost:5173"
if ($frontendProto -eq "https") {
    Write-Host "  [WARNING] Accept security warning (self-signed certificate)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "From Mobile (same network):"
Write-Host "  1. Open: $frontendProto://$IP:5173"
if ($frontendProto -eq "https") {
    Write-Host "  2. Accept security warning (Advanced > Proceed)"
    Write-Host "  3. Login: username='supervisor', password=(empty)"
} else {
    Write-Host "  2. Login: username='supervisor', password=(empty)"
}
Write-Host "  Or try: security, cleaning, parking"
Write-Host ""
if ($UseNgrok) {
    Write-Host "From Anywhere (via ngrok):"
    Write-Host "  1. Check ngrok web interface: http://localhost:4040"
    Write-Host "  2. Use the public URL shown there"
    Write-Host ""
}
Write-Host "To stop: Run stop.bat or close the PowerShell windows"
Write-Host ""
Write-Host "Tip: Run with --ngrok flag to start ngrok tunnel: .\start.ps1 --ngrok"
Write-Host ""

Read-Host "Press Enter to exit"

