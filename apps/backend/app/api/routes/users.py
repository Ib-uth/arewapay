from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.db import get_db
from app.deps.auth import CurrentUser
from app.schemas.auth import (
    DeleteAccountRequest,
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
    db.commit()
    db.refresh(user)
    return MeResponse(user=UserPublic.from_user(db, user))


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
