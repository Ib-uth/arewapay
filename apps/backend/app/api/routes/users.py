import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.db import get_db
from app.deps.auth import CurrentUser
from app.schemas.auth import (
    DeleteAccountRequest,
    LogoUploadOut,
    MeResponse,
    OnboardingCompleteRequest,
    UserProfileUpdate,
    UserPublic,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeResponse)
def get_me(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    return MeResponse(user=UserPublic.from_user(db, user))


@router.patch("/me", response_model=MeResponse)
def patch_me(
    body: UserProfileUpdate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    data = body.model_dump(exclude_unset=True)
    if "display_name" in data:
        user.display_name = data["display_name"]
    if "country_code" in data:
        user.country_code = data["country_code"]
    if "currency_code" in data:
        user.currency_code = data["currency_code"]
    if "theme" in data:
        user.theme = data["theme"]
    if "org_name" in data:
        user.org_name = data["org_name"]
    if "logo_url" in data:
        user.logo_url = data["logo_url"]
    db.commit()
    db.refresh(user)
    return MeResponse(user=UserPublic.from_user(db, user))


_MAX_LOGO = 2 * 1024 * 1024
_LOGO_MAGIC: dict[str, tuple[bytes, str]] = {
    "image/png": (b"\x89PNG\r\n\x1a\n", ".png"),
    "image/jpeg": (b"\xff\xd8\xff", ".jpg"),
}


@router.post("/me/logo", response_model=LogoUploadOut)
async def upload_logo(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> LogoUploadOut:
    ct = (file.content_type or "").split(";")[0].strip().lower()
    if ct not in _LOGO_MAGIC:
        raise HTTPException(status_code=400, detail="Upload PNG or JPEG only")
    raw = await file.read()
    if len(raw) > _MAX_LOGO:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")
    magic, ext = _LOGO_MAGIC[ct]
    if len(raw) < len(magic) or raw[: len(magic)] != magic:
        raise HTTPException(status_code=400, detail="Invalid image file")
    logos = Path("uploads") / "logos"
    logos.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (logos / name).write_bytes(raw)
    rel = f"/uploads/logos/{name}"
    user.logo_url = rel
    db.commit()
    db.refresh(user)
    return LogoUploadOut(logo_url=rel)


@router.post("/me/onboarding", response_model=MeResponse)
def complete_onboarding(
    body: OnboardingCompleteRequest,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    user.display_name = body.display_name
    user.company_name = body.company_name
    user.country_code = body.country_code
    user.currency_code = body.currency_code
    user.onboarding_survey = body.survey
    user.onboarding_completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return MeResponse(user=UserPublic.from_user(db, user))


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    body: DeleteAccountRequest,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")
    db.delete(user)
    db.commit()
