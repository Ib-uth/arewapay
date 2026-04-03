from datetime import date, timedelta

from tests.helpers import register_payload


def test_invoice_create_and_payment(client):
    client.post("/auth/register", json=register_payload())
    cr = client.post(
        "/clients",
        json={
            "name": "Buyer Co",
            "address_line1": "1 Market Rd",
            "city": "Lagos",
            "country_code": "NG",
        },
    )
    client_id = cr.json()["id"]
    due = (date.today() + timedelta(days=7)).isoformat()
    ir = client.post(
        "/invoices",
        json={
            "client_id": client_id,
            "due_date": due,
            "tax_rate": "0.075",
            "currency": "NGN",
            "status": "sent",
            "items": [
                {"description": "Consulting", "quantity": "2", "unit_price": "50000"},
            ],
        },
    )
    assert ir.status_code == 201
    inv = ir.json()
    assert inv["bill_to_snapshot"] is not None
    assert "Buyer Co" in inv["bill_to_snapshot"]
    assert inv["status"] in ("sent", "partial", "paid")
    iid = inv["id"]
    pr = client.post(
        f"/invoices/{iid}/payments",
        json={"amount": str(inv["total"])},
    )
    assert pr.status_code == 200
    assert pr.json()["status"] == "paid"
