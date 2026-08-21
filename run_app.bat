@echo off
title OPUS AI STUDIO - DESKTOP PRO
echo ========================================================
echo   KHOI DONG OPUS AI STUDIO (DESKTOP PRO)
echo ========================================================
echo.

set PATH=C:\Users\thuyn\.local\bin;C:\Users\thuyn\.local\node;%PATH%

echo [1/3] Khoi dong FastAPI Backend Server (Port 8000)...
start /B "" ".\.venv\Scripts\python.exe" -u backend\api_server.py

echo [2/3] Khoi dong Vite Frontend Dev Server (Port 5173)...
cd frontend
start /B "" cmd /c "npm run dev"
cd ..

timeout /t 3 /nobreak >nul

echo [3/3] Mo Giao Dien Desktop App...
start http://localhost:5173

echo.
echo ========================================================
echo  Ung dung dang chay tai: http://localhost:5173
echo  Backend API dang chay tai: http://127.0.0.1:8000
echo ========================================================
echo  (Nhan Ctrl+C hoac dong cua so nay de tat ung dung)
pause
