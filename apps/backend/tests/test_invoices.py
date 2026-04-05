from datetime import date, timedelta

from tests.helpers import register_and_login


def test_invoice_create_and_payment(client):
    register_and_login(client)
    cr = client.post(
        "/clients",
        json={
            "name": "Buyer Co",
            "email": "buyer@example.com",
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
            "items": [
                {"description": "Consulting", "quantity": "2", "unit_price": "50000"},
            ],
        },
    )
    assert ir.status_code == 201
    inv = ir.json()
    assert inv["bill_to_snapshot"] is not None
    assert "Buyer Co" in inv["bill_to_snapshot"]
    assert inv["status"] == "draft"
    assert inv.get("times_sent", 0) == 0
    iid = inv["id"]
    sr = client.post(f"/invoices/{iid}/send")
    assert sr.status_code == 200
    inv = sr.json()
    assert inv["status"] == "sent"
    assert inv["times_sent"] == 1
    sr2 = client.post(f"/invoices/{iid}/send")
    assert sr2.status_code == 200
    assert sr2.json()["times_sent"] == 2
    pr = client.post(
        f"/invoices/{iid}/payments",
        json={"amount": str(inv["total"])},
    )
    assert pr.status_code == 200
    assert pr.json()["status"] == "paid"
