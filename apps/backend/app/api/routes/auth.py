import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response
from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token_jti,
    hash_password,
    hash_token,
    safe_decode,
    verify_password,
)
from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.registration_pending import RegistrationPending
from app.models.user import RefreshToken, User, UserRole
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    OtpStatusOut,
    RegisterOtpResponse,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendOtpRequest,
    TokenResponse,
    UserPublic,
)
from app.services.email import send_registration_otp_email
from app.services.registration_otp import (
    assert_can_resend_now,
    is_resend_exhausted,
    seconds_until_can_resend,
)

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


@router.post("/register/request", response_model=RegisterOtpResponse)
@limiter.limit("10/minute")
def register_request(
    request: Request,
    body: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> RegisterOtpResponse:
    exists = db.scalar(select(User).where(User.email == body.email))
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    exists_phone = db.scalar(select(User).where(User.phone == body.phone))
    if exists_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    otp = f"{secrets.randbelow(1_000_000):06d}"
    otp_h = hash_token(otp)
    now = datetime.now(UTC)
    exp = now + timedelta(minutes=15)
    row = db.get(RegistrationPending, body.email)
    if row:
        db.delete(row)
        db.flush()
    pending = RegistrationPending(
        email=body.email,
        otp_hash=otp_h,
        expires_at=exp,
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        hashed_password=hash_password(body.password),
        otp_send_count=1,
        last_otp_sent_at=now,
    )
    db.add(pending)
    db.commit()
    email_sent = send_registration_otp_email(body.email, otp)
    return RegisterOtpResponse(message="Verification code sent", email_sent=email_sent)


@router.get("/register/otp-status", response_model=OtpStatusOut)
def register_otp_status(
    db: Annotated[Session, Depends(get_db)],
    email: EmailStr = Query(...),
) -> OtpStatusOut:
    row = db.get(RegistrationPending, email)
    if not row:
        raise HTTPException(status_code=404, detail="No pending registration for this email")
    now = datetime.now(UTC)
    wait = seconds_until_can_resend(row, now)
    exhausted = is_resend_exhausted(row)
    can_resend = not exhausted and wait == 0
    return OtpStatusOut(
        wait_seconds=wait,
        can_resend=can_resend,
        exhausted=exhausted,
        sends_used=row.otp_send_count,
        email_configured=bool(settings.resend_api_key),
    )


@router.post("/register/resend", response_model=RegisterOtpResponse)
@limiter.limit("10/minute")
def register_resend(
    request: Request,
    body: ResendOtpRequest,
    db: Annotated[Session, Depends(get_db)],
) -> RegisterOtpResponse:
    row = db.get(RegistrationPending, body.email)
    if not row:
        raise HTTPException(status_code=404, detail="No pending registration for this email")
    now = datetime.now(UTC)
    exp = row.expires_at
    if exp is not None and exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    if exp is None or exp < now:
        db.delete(row)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Registration expired — start over from sign up",
        )
    assert_can_resend_now(row, now)
    otp = f"{secrets.randbelow(1_000_000):06d}"
    row.otp_hash = hash_token(otp)
    row.expires_at = now + timedelta(minutes=15)
    row.otp_send_count += 1
    row.last_otp_sent_at = now
    db.commit()
    email_sent = send_registration_otp_email(body.email, otp)
    return RegisterOtpResponse(message="New verification code sent", email_sent=email_sent)


@router.post("/register/verify", response_model=TokenResponse)
@limiter.limit("10/minute")
def register_verify(
    request: Request,
    body: RegisterVerifyRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    row = db.get(RegistrationPending, body.email)
    now = datetime.now(UTC)
    exp = row.expires_at if row else None
    if exp is not None and exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    if not row or exp is None or exp < now:
        if row:
            db.delete(row)
            db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    if row.otp_hash != hash_token(body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    exists = db.scalar(select(User).where(User.email == body.email))
    if exists:
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=400, detail="Email already registered")
    display = f"{row.first_name} {row.last_name}".strip()
    user = User(
        email=row.email,
        hashed_password=row.hashed_password,
        role=UserRole.owner,
        first_name=row.first_name,
        last_name=row.last_name,
        phone=row.phone,
        display_name=display or None,
        email_verified_at=datetime.now(UTC),
    )
    db.delete(row)
    db.add(user)
    db.commit()
    return TokenResponse(message="Registered — you can log in")


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register_legacy(
    request: Request,
    body: RegisterRequest,
) -> TokenResponse:
    raise HTTPException(
        status_code=400,
        detail=(
            "Use POST /auth/register/request with your details, then POST /auth/register/verify "
            "with the email code."
        ),
    )


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
    if user.email_verified_at is None:
        raise HTTPException(
            status_code=403,
            detail="Verify your email with the code we sent before logging in.",
        )
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
