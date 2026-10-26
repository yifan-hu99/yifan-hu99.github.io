@echo off
cd /d "%~dp0"
set "CAMBIUM_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "CAMBIUM_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\next\dist\bin\next" (
 echo Install dependencies and build first. See README.md.
 pause
 exit /b 1
)
if not exist ".build-dir" (
 echo Run npm run db:setup and npm run build first. See README.md.
 pause
 exit /b 1
)
echo Cambium is starting at http://localhost:3000
"%CAMBIUM_NODE%" "node_modules\next\dist\bin\next" start --hostname 127.0.0.1
pause
