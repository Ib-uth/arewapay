from tests.helpers import register_payload


def _register(client):
    client.post("/auth/register", json=register_payload())


def test_clients_crud(client):
    _register(client)
    r = client.post(
        "/clients",
        json={
            "name": "Acme Ltd",
            "email": "acme@example.com",
            "city": "Kano",
            "country_code": "ng",
        },
    )
    assert r.status_code == 201
    body = r.json()
    cid = body["id"]
    assert body["city"] == "Kano"
    assert body["country_code"] == "NG"
    r2 = client.get("/clients")
    assert len(r2.json()) == 1
    r3 = client.patch(f"/clients/{cid}", json={"phone": "+234800"})
    assert r3.status_code == 200
    assert r3.json()["phone"] == "+234800"
