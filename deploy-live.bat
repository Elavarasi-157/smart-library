@echo off
title Madras Institute of Technology - Live Online Deploy
color 0B

echo ==============================================================
echo    MIT SMART LIBRARY - PUBLIC INTERNET DEPLOYMENT
echo ==============================================================
echo.

echo [1/3] Building latest frontend bundle...
call npm run build

echo [2/3] Starting backend server in background...
start /B node server/server.js

timeout /t 3 >nul

echo [3/3] Creating direct 1-click Cloudflare Tunnel...
echo.
echo --------------------------------------------------------------
echo  Please wait 5-10 seconds for your live public URL below:
echo --------------------------------------------------------------
echo.
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared is not installed or not in PATH.
    echo Install Cloudflare Tunnel (cloudflared) and try again.
    pause
    exit /b 1
)
cloudflared tunnel --protocol http2 --url http://127.0.0.1:5000 --http-host-header 127.0.0.1
