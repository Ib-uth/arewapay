from datetime import date, timedelta

from tests.helpers import register_payload


def test_dashboard_summary(client):
    client.post("/auth/register", json=register_payload())
    r = client.get("/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    assert "total_invoiced" in body
    assert "overdue_count" in body


def test_top_clients_by_revenue(client):
    client.post("/auth/register", json=register_payload())
    c1 = client.post("/clients", json={"name": "Small Buyer"}).json()
    c2 = client.post("/clients", json={"name": "Big Buyer"}).json()
    due = (date.today() + timedelta(days=7)).isoformat()

    inv1 = client.post(
        "/invoices",
        json={
            "client_id": c1["id"],
            "due_date": due,
            "tax_rate": "0",
            "currency": "NGN",
            "status": "sent",
            "items": [{"description": "A", "quantity": "1", "unit_price": "1000"}],
        },
    ).json()
    client.post(f"/invoices/{inv1['id']}/payments", json={"amount": inv1["total"]})

    inv2 = client.post(
        "/invoices",
        json={
            "client_id": c2["id"],
            "due_date": due,
            "tax_rate": "0",
            "currency": "NGN",
            "status": "sent",
            "items": [{"description": "B", "quantity": "1", "unit_price": "5000"}],
        },
    ).json()
    client.post(f"/invoices/{inv2['id']}/payments", json={"amount": inv2["total"]})

    r = client.get("/dashboard/top-clients")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 2
    assert rows[0]["client_name"] == "Big Buyer"
    assert rows[1]["client_name"] == "Small Buyer"
    assert float(rows[0]["total_revenue"]) > float(rows[1]["total_revenue"])
