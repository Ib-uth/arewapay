"""Production Uvicorn bind for Fly.io: IPv6 wildcard + IPv4-mapped (edge checks + 6PN)."""

from __future__ import annotations

import os
import socket

import uvicorn


def main() -> None:
    port = int(os.environ.get("PORT", os.environ.get("UVICORN_PORT", "8000")))
    log_level = os.environ.get("UVICORN_LOG_LEVEL", "info")

    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        sock.bind(("::", port))
        sock.listen(2048)
        uvicorn.run("app.main:app", fd=sock.fileno(), log_level=log_level)
    except OSError:
        # Docker Desktop / hosts without usable IPv6 dual-stack
        uvicorn.run(
            "app.main:app",
            host=os.environ.get("UVICORN_HOST", "0.0.0.0"),
            port=port,
            log_level=log_level,
        )


if __name__ == "__main__":
    main()
