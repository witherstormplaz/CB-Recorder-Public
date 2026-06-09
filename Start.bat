@echo off
title Chaturbate Recorder V2 - Launcher
color 0e

echo ========================================================
echo        Chaturbate Recorder V2 - Setup ^& Launch
echo ========================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Python is not installed or not in your system PATH!
    echo Please install Python 3.10 or higher from python.org and try again.
    pause
    exit /b 1
)

:: 2. Check Node
npm -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not in your system PATH!
    echo Please install Node.js from nodejs.org and try again.
    pause
    exit /b 1
)

:: 3. Install Python Dependencies
echo [1/3] Checking/Installing Python Backend Dependencies...
pip install -r requirements.txt --quiet
IF %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

:: 4. Install Node Dependencies
echo [2/3] Checking/Installing Frontend UI Dependencies...
cd frontend
call npm install --silent
IF %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Failed to install Node dependencies.
    pause
    exit /b 1
)

:: 5. Launch
echo [3/3] Launching the App...
echo.
call npm run electron:dev
