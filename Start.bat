@echo off
echo Starting the application...
echo Please wait while the application is loading...

REM Start backend server
echo starting backend server...
start cmd /k "cd backend && node server.js"

REM wait a moment for the backend to start
timeout /t 3 /nobreak >nul

REM start frontend server
echo starting frontend server...
start cmd /k "cd frontend && npm run dev"
echo All servers started successfully!
