from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=64)
    company: str | None = Field(None, max_length=255)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=128)
    region: str | None = Field(None, max_length=128)
    postal_code: str | None = Field(None, max_length=32)
    country_code: str | None = Field(None, min_length=2, max_length=2)
    notes: str | None = None

    @field_validator("country_code", mode="before")
    @classmethod
    def country_upper(cls, v: object) -> object:
        if v is None or v == "":
            return None
        if isinstance(v, str):
            return v.strip().upper()
        return v


class ClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=64)
    company: str | None = Field(None, max_length=255)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=128)
    region: str | None = Field(None, max_length=128)
    postal_code: str | None = Field(None, max_length=32)
    country_code: str | None = Field(None, min_length=2, max_length=2)
    notes: str | None = None

    @field_validator("country_code", mode="before")
    @classmethod
    def country_upper_u(cls, v: object) -> object:
        if v is None or v == "":
            return None
        if isinstance(v, str):
            return v.strip().upper()
        return v


class ClientOut(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    email: str | None
    phone: str | None
    company: str | None
    address_line1: str | None
    address_line2: str | None
    city: str | None
    region: str | None
    postal_code: str | None
    country_code: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
