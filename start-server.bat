@echo off
echo Starting FareWise local server...
echo.
echo Opening http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
start http://localhost:8000
python -m http.server 8000
pause
