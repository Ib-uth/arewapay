import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from tests.helpers import register_payload


def _register(client):
    client.post("/auth/register", json=register_payload())
    r = client.get("/auth/me")
    assert r.status_code == 200
    return r.json()["user"]["id"]


def test_client_limit_free_tier(client):
    _register(client)

    for i in range(5):
        r = client.post("/clients", json={"name": f"C{i}"})
        assert r.status_code == 201, r.text

    r6 = client.post("/clients", json={"name": "Too many"})
    assert r6.status_code == 403
    assert "limit" in r6.json()["detail"].lower()


def test_invoice_limit_free_tier(client, db_session: Session):
    uid = _register(client)
    owner_id = uuid.UUID(uid)

    c = Client(owner_id=owner_id, name="Only", email=None)
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    for i in range(20):
        inv = Invoice(
            owner_id=owner_id,
            client_id=c.id,
            invoice_number=f"INV-2026-{i:05d}",
            status=InvoiceStatus.draft,
            currency="USD",
            tax_rate=Decimal("0"),
            due_date=date(2026, 6, 15),
        )
        db_session.add(inv)
    db_session.commit()

    r = client.post(
        "/invoices",
        json={
            "client_id": str(c.id),
            "status": "draft",
            "currency": "USD",
            "tax_rate": "0",
            "due_date": "2026-12-31",
            "items": [{"description": "x", "quantity": "1", "unit_price": "10.00"}],
        },
    )
    assert r.status_code == 403
    assert "limit" in r.json()["detail"].lower()
