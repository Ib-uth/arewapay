from datetime import datetime
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=32)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def strip_names(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def strip_phone(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

    @field_validator("otp", mode="before")
    @classmethod
    def digits_only(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
            if not v.isdigit():
                raise ValueError("Code must be 6 digits")
        return v


class TokenResponse(BaseModel):
    message: str = "ok"


class RegisterOtpResponse(BaseModel):
    message: str
    email_sent: bool = False


class ResendOtpRequest(BaseModel):
    email: EmailStr


class OtpStatusOut(BaseModel):
    wait_seconds: int
    can_resend: bool
    exhausted: bool
    sends_used: int
    max_sends: int = 5
    email_configured: bool = False


class PlanLimitsOut(BaseModel):
    max_clients: int | None
    max_invoices_per_30_days: int | None


class PlanUsageOut(BaseModel):
    clients: int
    invoices_last_30_days: int


class UserPublic(BaseModel):
    id: UUID
    email: str
    role: UserRole
    email_verified: bool
    phone_verified: bool = False
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    display_name: str | None = None
    country_code: str | None = None
    currency_code: str | None = None
    theme: Literal["light", "dark", "system"] | None = None
    onboarding_completed_at: datetime | None = None
    subscription_tier: str
    subscription_expires_at: datetime | None = None
    limits: PlanLimitsOut
    usage: PlanUsageOut

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, db: Session, u: object) -> "UserPublic":
        from app.core.plans import limits_for
        from app.models.user import User as UserModel
        from app.services.plan_enforcement import effective_tier
        from app.services.usage import count_clients_for_owner, count_invoices_last_30_days

        assert isinstance(u, UserModel)
        theme_val: str | None = u.theme
        if theme_val not in ("light", "dark", "system", None):
            theme_val = "system"
        tier = effective_tier(u)
        lim = limits_for(tier)
        return cls(
            id=u.id,
            email=u.email,
            role=u.role,
            email_verified=u.email_verified_at is not None,
            phone_verified=u.phone_verified_at is not None,
            first_name=u.first_name,
            last_name=u.last_name,
            phone=u.phone,
            display_name=u.display_name,
            country_code=u.country_code.upper() if u.country_code else None,
            currency_code=u.currency_code.upper() if u.currency_code else None,
            theme=theme_val,  # type: ignore[arg-type]
            onboarding_completed_at=u.onboarding_completed_at,
            subscription_tier=tier.value,
            subscription_expires_at=u.subscription_expires_at,
            limits=PlanLimitsOut(
                max_clients=lim.max_clients,
                max_invoices_per_30_days=lim.max_invoices_per_30_days,
            ),
            usage=PlanUsageOut(
                clients=count_clients_for_owner(db, u.id),
                invoices_last_30_days=count_invoices_last_30_days(db, u.id),
            ),
        )


class UserProfileUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=255)
    country_code: str | None = Field(None, min_length=2, max_length=2)
    currency_code: str | None = Field(None, min_length=3, max_length=3)
    theme: Literal["light", "dark", "system"] | None = None

    @field_validator("country_code", "currency_code", mode="before")
    @classmethod
    def upper_strip(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class OnboardingCompleteRequest(BaseModel):
    display_name: str | None = Field(None, max_length=255)
    company_name: str | None = Field(None, max_length=255)
    country_code: str = Field(..., min_length=2, max_length=2)
    currency_code: str = Field(..., min_length=3, max_length=3)
    survey: dict[str, str] | None = None

    @field_validator("country_code", "currency_code", mode="before")
    @classmethod
    def upper_strip(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("company_name", "display_name", mode="before")
    @classmethod
    def strip_opt(cls, v: object) -> object:
        if isinstance(v, str):
            s = v.strip()
            return s or None
        return v

    @field_validator("survey", mode="before")
    @classmethod
    def survey_bounds(cls, v: object) -> object:
        if v is None:
            return None
        if not isinstance(v, dict):
            raise ValueError("Survey must be an object")
        if len(v) > 5:
            raise ValueError("At most 5 survey answers")
        out: dict[str, str] = {}
        for k, val in v.items():
            if not isinstance(k, str) or not k.strip():
                raise ValueError("Invalid survey key")
            if not isinstance(val, str):
                raise ValueError("Survey values must be strings")
            if len(val) > 500:
                raise ValueError("Survey answer too long")
            out[k.strip()[:64]] = val.strip()[:500]
        return out or None


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=1)


class MeResponse(BaseModel):
    user: UserPublic
