@echo off
title Stop Smart Library System
color 0C

echo ==============================================================
echo    STOPPING SMART LIBRARY SYSTEM (MIT CHENNAI)
echo ==============================================================
echo.

echo [1/3] Terminating frontend Vite process (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Terminating backend Node process (port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Stopping any running Cloudflare tunnels...
taskkill /F /IM cloudflared_runner.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

echo.
color 0A
echo ==============================================================
echo  SUCCESS: All Smart Library services have been stopped cleanly!
echo ==============================================================
echo.
timeout /t 3
