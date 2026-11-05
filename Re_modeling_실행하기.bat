@echo off
chcp 65001 >nul
title Re:modeling - Belotero Revive Executive Portal
echo ========================================================
echo   Re:modeling (벨로테로 리바이브 B2B 브리핑 포털) 실행 중...
echo ========================================================
set "PATH=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\node\node-v20.18.3-win-x64;%PATH%"
cd /d "%~dp0"
start "" "http://localhost:3000"
call npm.cmd run dev
pause
