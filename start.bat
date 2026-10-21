@echo off
title Madras Institute of Technology - Smart Library System
color 0E

echo ==============================================================
echo    MADRAS INSTITUTE OF TECHNOLOGY - CENTRAL LIBRARY SYSTEM
echo ==============================================================
echo.
echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)
if not exist "client\node_modules\" (
    echo Installing client dependencies...
    cd client && call npm install && cd ..
)

echo [3/3] Starting Smart Library Server ^& Client...
echo.
echo --------------------------------------------------------------
echo  Portal will open at: http://localhost:5173
echo  Backend API running at: http://localhost:5000
echo --------------------------------------------------------------
echo.
echo Press Ctrl + C anytime in this window to stop the servers.
echo Or double-click "stop.bat" to shut down all processes.
echo.

start "" "http://localhost:5173"
npm run dev
