from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.invoice import InvoiceStatus


class InvoiceItemIn(BaseModel):
    description: str = Field(min_length=1, max_length=512)
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class InvoiceCreate(BaseModel):
    client_id: UUID
    due_date: date
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=1)
    currency: str = Field(default="NGN", max_length=8)
    notes: str | None = None
    items: list[InvoiceItemIn] = Field(min_length=1)
    status: InvoiceStatus = InvoiceStatus.draft


class InvoiceUpdate(BaseModel):
    due_date: date | None = None
    tax_rate: Decimal | None = Field(default=None, ge=0, le=1)
    notes: str | None = None
    status: InvoiceStatus | None = None
    items: list[InvoiceItemIn] | None = None


class InvoiceItemOut(BaseModel):
    id: UUID
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class InvoiceOut(BaseModel):
    id: UUID
    owner_id: UUID
    client_id: UUID
    invoice_number: str
    status: InvoiceStatus
    currency: str
    tax_rate: Decimal
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    due_date: date
    bill_to_snapshot: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[InvoiceItemOut]

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    note: str | None = None
    reference: str | None = Field(None, max_length=128)

    @field_validator("amount")
    @classmethod
    def two_decimals(cls, v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"))
