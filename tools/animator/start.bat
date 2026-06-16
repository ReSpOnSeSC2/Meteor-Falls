@echo off
REM ===========================================================================
REM  Cadence launcher (Windows) — one command to install deps + run the app.
REM  Opens http://localhost:8000 ; also prints a LAN URL for phone access.
REM ===========================================================================
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM --- pick a Python interpreter --------------------------------------------
set "PY=python"
where python >nul 2>nul
if errorlevel 1 (
    where py >nul 2>nul
    if errorlevel 1 (
        echo [Cadence] Python was not found on PATH. Install Python 3.10+ first.
        exit /b 1
    )
    set "PY=py"
)

echo [Cadence] Installing/updating dependencies...
%PY% -m pip install -r requirements.txt
if errorlevel 1 (
    echo [Cadence] Dependency install failed.
    exit /b 1
)

REM --- discover the LAN IP for phone access ---------------------------------
set "LANIP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    if not defined LANIP (
        set "LANIP=%%a"
        set "LANIP=!LANIP: =!"
    )
)

echo.
echo [Cadence] Backend starting on http://localhost:8000
if defined LANIP (
    echo [Cadence] On your phone ^(same Wi-Fi^): http://!LANIP!:8000
)
echo.

REM --- open the browser, then run the server (foreground) --------------------
start "" "http://localhost:8000"

REM Prefer the package runner if present, else fall back to uvicorn directly.
%PY% -c "import importlib.util,sys; sys.exit(0 if importlib.util.find_spec('server.run') else 1)" 2>nul
if errorlevel 1 (
    %PY% -m uvicorn server.app:app --host 0.0.0.0 --port 8000
) else (
    %PY% -m server.run
)

endlocal
