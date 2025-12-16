@echo off
REM Setup ngrok for Verolux Management System (Windows)
REM This script helps set up ngrok tunnels

echo.
echo ========================================
echo   ngrok Setup for Verolux System
echo ========================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
cd /d "%PROJECT_DIR%"

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok is installed in PATH
    set "NGROK_CMD=ngrok"
    goto :check_auth
)

REM Check if ngrok.exe exists in project directory
if exist "%PROJECT_DIR%ngrok.exe" (
    echo [OK] ngrok.exe found in project directory
    set "NGROK_CMD=%PROJECT_DIR%ngrok.exe"
    goto :check_auth
)

REM ngrok not found - provide installation instructions
echo [WARNING] ngrok is not installed
echo.
echo Installation Steps:
echo.
echo 1. Download ngrok for Windows:
echo    https://ngrok.com/download
echo.
echo 2. Extract ngrok.exe to one of these locations:
echo    - Project root: %PROJECT_DIR%ngrok.exe
echo    - Or add to Windows PATH
echo.
echo 3. After installation, run this script again
echo.
pause
exit /b 1

:check_auth
echo.
echo [*] Checking ngrok authentication...
"%NGROK_CMD%" config check >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok is authenticated
    goto :setup_complete
)

echo [WARNING] ngrok is not authenticated
echo.
echo To authenticate ngrok:
echo.
echo 1. Sign up for free account at:
echo    https://dashboard.ngrok.com/signup
echo.
echo 2. Get your authtoken from:
echo    https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo 3. Run this command (replace YOUR_TOKEN with your actual token):
echo    %NGROK_CMD% config add-authtoken YOUR_TOKEN
echo.
set /p "HAS_TOKEN=Do you have an ngrok authtoken? (y/n): "
if /i "%HAS_TOKEN%"=="y" (
    set /p "AUTHTOKEN=Enter your ngrok authtoken: "
    "%NGROK_CMD%" config add-authtoken "%AUTHTOKEN%"
    if %errorlevel% equ 0 (
        echo [OK] ngrok authenticated successfully
    ) else (
        echo [ERROR] Failed to authenticate ngrok
        pause
        exit /b 1
    )
) else (
    echo.
    echo [INFO] You can still use ngrok without authentication
    echo        but with limited features (session timeout, etc.)
    echo.
)

:setup_complete
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To use ngrok with your system:
echo.
echo 1. Start the system with ngrok:
echo    start.bat --ngrok
echo.
echo 2. Or start ngrok manually:
echo    ngrok http 5173
echo.
echo 3. Check ngrok web interface:
echo    http://localhost:4040
echo.
echo The public URL will be shown in the ngrok web interface
echo and can be used to access your system from anywhere!
echo.
pause

