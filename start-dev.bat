@echo off
REM Windows startup script for PDP LABAN Membership Form App

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Starting PDP LABAN Membership Form App...
echo ==========================================
echo.

REM Check if .env file exists
if not exist "server\.env" (
    echo ERROR: server\.env file not found
    echo Please create server\.env using server\.env.example
    echo Run: copy server\.env.example server\.env
    pause
    exit /b 1
)

echo Starting backend server on port 3000...
echo.
start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 2

echo Starting frontend server on port 5173...
echo.
start "Frontend Server" cmd /k "cd client && npm run dev"
timeout /t 2

echo.
echo ==========================================
echo Application is running!
echo ==========================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:3000
echo.
echo Close the opened windows to stop the servers.
pause
