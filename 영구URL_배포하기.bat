@echo off
chcp 65001 >nul
title Re:modeling 영구 URL 업데이트 도우미
cd /d "%~dp0"

set "GIT_EXE=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\mingit\bin\cmd\git.exe"
set "NODE_EXE=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\node\node-v20.18.3-win-x64\node.exe"
set "PUSH_SCRIPT=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\push_github.mjs"

echo ========================================================
echo   Re:modeling (벨로테로 리바이브 포털) GitHub 업로드
echo ========================================================
echo.
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "Update Re:modeling portal" >nul 2>&1
"%NODE_EXE%" "%PUSH_SCRIPT%"

echo.
echo ========================================================
echo   GitHub (alwaysyun723-pixel/revive) 업로드 완료!
echo ========================================================
pause
