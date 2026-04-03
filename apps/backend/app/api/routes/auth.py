import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_email_verify_token,
    create_refresh_token_jti,
    hash_password,
    hash_token,
    safe_decode,
    verify_password,
)
from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.user import RefreshToken, User, UserRole
from app.schemas.auth import LoginRequest, MeResponse, RegisterRequest, TokenResponse, UserPublic
from app.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, access: str, refresh_raw: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
        secure=settings.cookie_secure,
        domain=settings.cookie_domain,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_raw,
        httponly=True,
        max_age=settings.refresh_token_expire_days * 86400,
        samesite="lax",
        secure=settings.cookie_secure,
        domain=settings.cookie_domain,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", domain=settings.cookie_domain, path="/")
    response.delete_cookie("refresh_token", domain=settings.cookie_domain, path="/")


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register(
    request: Request,
    body: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
) -> TokenResponse:
    exists = db.scalar(select(User).where(User.email == body.email))
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    exists_phone = db.scalar(select(User).where(User.phone == body.phone))
    if exists_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    display = f"{body.first_name} {body.last_name}".strip()
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.owner,
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        display_name=display or None,
    )
    db.add(user)
    db.flush()
    raw_refresh = create_refresh_token_jti()
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(rt)
    db.commit()
    access = create_access_token(str(user.id), {"role": user.role.value})
    _set_auth_cookies(response, access, raw_refresh)
    token = create_email_verify_token(user.id, user.email)
    verify_url = f"{settings.public_app_url}/verify-email?token={token}"
    send_verification_email(user.email, verify_url)
    return TokenResponse(message="Registered")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    raw_refresh = create_refresh_token_jti()
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(rt)
    db.commit()
    access = create_access_token(str(user.id), {"role": user.role.value})
    _set_auth_cookies(response, access, raw_refresh)
    return TokenResponse(message="Logged in")


@router.post("/logout", response_model=TokenResponse)
def logout(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    if refresh_token:
        h = hash_token(refresh_token)
        row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == h))
        if row:
            db.delete(row)
            db.commit()
    _clear_auth_cookies(response)
    return TokenResponse(message="Logged out")


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("60/minute")
def refresh(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    h = hash_token(refresh_token)
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == h))
    if not row or row.expires_at < datetime.now(UTC):
        _clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    db.delete(row)
    new_raw = create_refresh_token_jti()
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_raw),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(new_rt)
    db.commit()
    access = create_access_token(str(user.id), {"role": user.role.value})
    _set_auth_cookies(response, access, new_raw)
    return TokenResponse(message="Refreshed")


@router.get("/me", response_model=MeResponse)
def me(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    return MeResponse(user=UserPublic.from_user(db, user))


@router.get("/verify-email", response_model=TokenResponse)
def verify_email(
    db: Annotated[Session, Depends(get_db)],
    token: str = Query(...),
) -> TokenResponse:
    payload = safe_decode(token)
    if not payload or payload.get("typ") != "verify_email":
        raise HTTPException(status_code=400, detail="Invalid token")
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = db.get(User, uuid.UUID(uid))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email_verified_at = datetime.now(UTC)
    db.commit()
    return TokenResponse(message="Email verified")


@router.patch("/me/role", response_model=MeResponse)
def update_my_role(
    role: UserRole,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    from app.core.rbac import require_owner

    require_owner(user)
    user.role = role
    db.commit()
    db.refresh(user)
    return MeResponse(user=UserPublic.from_user(db, user))
