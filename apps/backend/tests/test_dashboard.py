from datetime import date, timedelta

from tests.helpers import register_and_login


def test_dashboard_summary(client):
    register_and_login(client)
    r = client.get("/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    assert "total_invoiced" in body
    assert "overdue_count" in body


def test_top_clients_by_revenue(client):
    register_and_login(client)
    c1 = client.post("/clients", json={"name": "Small Buyer", "email": "s@example.com"}).json()
    c2 = client.post("/clients", json={"name": "Big Buyer", "email": "b@example.com"}).json()
    due = (date.today() + timedelta(days=7)).isoformat()

    inv1 = client.post(
        "/invoices",
        json={
            "client_id": c1["id"],
            "due_date": due,
            "tax_rate": "0",
            "currency": "NGN",
            "items": [{"description": "A", "quantity": "1", "unit_price": "1000"}],
        },
    ).json()
    assert client.post(f"/invoices/{inv1['id']}/send").status_code == 200
    client.post(f"/invoices/{inv1['id']}/payments", json={"amount": inv1["total"]})

    inv2 = client.post(
        "/invoices",
        json={
            "client_id": c2["id"],
            "due_date": due,
            "tax_rate": "0",
            "currency": "NGN",
            "items": [{"description": "B", "quantity": "1", "unit_price": "5000"}],
        },
    ).json()
    assert client.post(f"/invoices/{inv2['id']}/send").status_code == 200
    client.post(f"/invoices/{inv2['id']}/payments", json={"amount": inv2["total"]})

    r = client.get("/dashboard/top-clients")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 2
    assert rows[0]["client_name"] == "Big Buyer"
    assert rows[1]["client_name"] == "Small Buyer"
    assert float(rows[0]["total_revenue"]) > float(rows[1]["total_revenue"])
