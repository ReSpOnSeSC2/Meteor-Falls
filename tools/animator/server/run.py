"""
run.py — launch the Cadence backend with uvicorn.

Run from the ``animator/`` directory::

    python -m server.run

Serves the API + static frontend on http://0.0.0.0:8000 and prints the LAN URL
so you can open the tool from another device on the same network.
"""
from __future__ import annotations

import socket

import uvicorn

HOST = "0.0.0.0"
PORT = 8000


def _lan_ip() -> str:
    """Best-effort primary LAN IPv4 of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))  # no packets sent; just picks the route's iface
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def main() -> None:
    ip = _lan_ip()
    print("Cadence backend starting…")
    print(f"  local:  http://127.0.0.1:{PORT}")
    print(f"  LAN:    http://{ip}:{PORT}")
    uvicorn.run("server.app:app", host=HOST, port=PORT, reload=False)


if __name__ == "__main__":
    main()
