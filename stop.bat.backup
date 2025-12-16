@echo off
REM Verolux Management System - Stop Script for Windows
REM This script stops both backend and frontend servers

echo.
echo ========================================
echo   Stopping Verolux Management System
echo ========================================
echo.

REM Stop Backend (port 8000)
echo [*] Stopping Backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend stopped
    )
)
echo.

REM Stop Frontend (port 5173)
echo [*] Stopping Frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend stopped
    )
)
echo.

REM Stop ngrok
echo [*] Stopping ngrok...
taskkill /F /IM ngrok.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok stopped
) else (
    echo [INFO] ngrok not running
)
echo.

echo ========================================
echo   All services stopped
echo ========================================
echo.

timeout /t 2 /nobreak >nul

