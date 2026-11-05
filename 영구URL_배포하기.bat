@echo off
chcp 65001 >nul
title Re:modeling 영구 URL 배포 도우미
cd /d "%~dp0"

set "GH_EXE=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\gh\bin\gh.exe"
set "GIT_EXE=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\mingit\bin\cmd\git.exe"
set "PATH=C:\Users\alway\.gemini\antigravity\brain\13cd3277-bca6-44a0-a922-9b068f6a69bd\scratch\mingit\bin\cmd;%PATH%"

echo ========================================================
echo   Re:modeling (벨로테로 리바이브 포털) 영구 URL 배포
echo ========================================================
echo.
echo [1/3] GitHub 계정 연결을 진행합니다...
"%GH_EXE%" auth status >nul 2>&1
if %errorlevel% neq 0 (
    "%GH_EXE%" auth login --web -h github.com -p https
)

echo.
echo [2/3] 최신 코드를 GitHub 저장소(alwaysyun723-pixel/revive)에 업로드합니다...
"%GH_EXE%" auth setup-git
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "Update Re:modeling portal" >nul 2>&1
"%GIT_EXE%" push -u origin main --force

echo.
echo [3/3] Vercel 영구 고정 URL 생성 페이지를 엽니다...
start "" "https://vercel.com/new/clone?repository-url=https://github.com/alwaysyun723-pixel/revive&project-name=merz-revive"
echo.
echo ========================================================
echo   완료! 열린 인터넷 창에서 [Deploy] 버튼만 누르시면
echo   영구 고정 URL (https://merz-revive.vercel.app) 이 생성됩니다!
echo ========================================================
pause
