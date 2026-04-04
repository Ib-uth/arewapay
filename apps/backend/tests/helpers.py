import uuid

from fastapi.testclient import TestClient

from app.services.email import consume_last_test_otp


def register_payload() -> dict:
    u = uuid.uuid4().hex[:12]
    return {
        "email": f"u{u}@test.com",
        "password": "password123",
        "confirm_password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "phone": f"+23480{u}",
    }


def register_and_login(client: TestClient) -> dict:
    """Create a verified user and establish an authenticated session (cookies)."""
    body = register_payload()
    assert client.post("/auth/register/request", json=body).status_code == 200
    otp = consume_last_test_otp()
    assert otp
    r_verify = client.post(
        "/auth/register/verify",
        json={"email": body["email"], "otp": otp},
    )
    assert r_verify.status_code == 200
    r_login = client.post(
        "/auth/login",
        json={"email": body["email"], "password": body["password"]},
    )
    assert r_login.status_code == 200
    return body
