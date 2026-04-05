from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, clients, dashboard, invoices, users
from app.config import settings
from app.core.limiter import limiter


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Email-Sent"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(invoices.router)
app.include_router(dashboard.router)

Path("uploads").mkdir(parents=True, exist_ok=True)
Path("uploads/logos").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    """API-only service: use /docs for Swagger, /health for probes."""
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
