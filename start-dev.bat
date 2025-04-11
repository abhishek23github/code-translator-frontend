@echo off
echo Starting Code Translator App...

:: Set Node.js path
set PATH=C:\Portable\nodejs\node-v23.11.0-win-x64;%PATH%

:: Open backend terminal
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

:: Open frontend terminal
start cmd /k "cd frontend && npm start"

:: Wait a bit then open browser (optional)
timeout /t 5 >nul
start http://localhost:3000
