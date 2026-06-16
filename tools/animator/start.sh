#!/usr/bin/env bash
# ===========================================================================
#  Cadence launcher (macOS / Linux) — install deps + run the app.
#  Opens http://localhost:8000 ; also prints a LAN URL for phone access.
# ===========================================================================
set -euo pipefail

cd "$(dirname "$0")"

# --- pick a Python interpreter --------------------------------------------
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "[Cadence] Python was not found on PATH. Install Python 3.10+ first."
  exit 1
fi

echo "[Cadence] Installing/updating dependencies..."
"$PY" -m pip install -r requirements.txt

# --- discover a LAN IP for phone access -----------------------------------
LANIP=""
if command -v ipconfig >/dev/null 2>&1; then
  LANIP="$(ipconfig getifaddr en0 2>/dev/null || true)"
fi
if [ -z "${LANIP}" ] && command -v hostname >/dev/null 2>&1; then
  LANIP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi

echo
echo "[Cadence] Backend starting on http://localhost:8000"
if [ -n "${LANIP}" ]; then
  echo "[Cadence] On your phone (same Wi-Fi): http://${LANIP}:8000"
fi
echo

# --- open the browser (best effort, non-fatal) ----------------------------
URL="http://localhost:8000"
if command -v open >/dev/null 2>&1; then
  (sleep 1; open "$URL") >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 1; xdg-open "$URL") >/dev/null 2>&1 &
fi

# --- run the server (foreground) ------------------------------------------
if "$PY" -c "import importlib.util,sys; sys.exit(0 if importlib.util.find_spec('server.run') else 1)" 2>/dev/null; then
  exec "$PY" -m server.run
else
  exec "$PY" -m uvicorn server.app:app --host 0.0.0.0 --port 8000
fi
