from tests.helpers import register_payload


def test_register_login_me(client):
    body = register_payload()
    email = body["email"]
    r = client.post("/auth/register", json=body)
    assert r.status_code == 200
    assert client.cookies.get("access_token")

    r2 = client.get("/auth/me")
    assert r2.status_code == 200
    assert r2.json()["user"]["email"] == email


def test_login_invalid(client):
    r = client.post(
        "/auth/login",
        json={"email": "nope@test.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_logout(client):
    client.post("/auth/register", json=register_payload())


def test_register_password_mismatch(client):
    r = client.post(
        "/auth/register",
        json={
            "email": "mismatch@test.com",
            "password": "password123",
            "confirm_password": "password999",
            "first_name": "A",
            "last_name": "B",
            "phone": "+2348000111222",
        },
    )
    assert r.status_code == 422


def test_register_duplicate_phone(client):
    body = register_payload()
    assert client.post("/auth/register", json=body).status_code == 200
    body2 = register_payload()
    body2["phone"] = body["phone"]
    r = client.post("/auth/register", json=body2)
    assert r.status_code == 400
    assert "phone" in r.json()["detail"].lower()
    r = client.post("/auth/logout")
    assert r.status_code == 200
    r2 = client.get("/auth/me")
    assert r2.status_code == 401
