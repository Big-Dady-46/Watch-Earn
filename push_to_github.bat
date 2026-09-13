@echo off
cd /d "%~dp0"
set "PATH=C:\Users\Abdul-Hannan\AppData\Local\Programs\Git\cmd;C:\Users\Abdul-Hannan\AppData\Local\Programs\Git\mingw64\bin;%PATH%"
echo ==========================================================
echo   Pushing Watch ^& Earn to GitHub: Big-Dady-46/Watch-Earn
echo ==========================================================
echo.
git push -u origin main
echo.
echo ==========================================================
echo   Done! Press any key to close this window.
echo ==========================================================
pause
