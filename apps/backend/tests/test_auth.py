from datetime import UTC, datetime, timedelta

from app.services.email import consume_last_test_otp
from tests.helpers import register_payload


def test_register_verify_login_me(client):
    body = register_payload()
    email = body["email"]
    r = client.post("/auth/register/request", json=body)
    assert r.status_code == 200
    otp = consume_last_test_otp()
    assert otp and len(otp) == 6
    assert not client.cookies.get("access_token")

    r2 = client.post("/auth/register/verify", json={"email": email, "otp": otp})
    assert r2.status_code == 200
    assert not client.cookies.get("access_token")

    r3 = client.post("/auth/login", json={"email": email, "password": body["password"]})
    assert r3.status_code == 200
    assert client.cookies.get("access_token")

    r4 = client.get("/auth/me")
    assert r4.status_code == 200
    assert r4.json()["user"]["email"] == email
    assert r4.json()["user"]["email_verified"] is True


def test_me_returns_org_name_and_logo_after_patch(client):
    body = register_payload()
    client.post("/auth/register/request", json=body)
    otp = consume_last_test_otp()
    client.post("/auth/register/verify", json={"email": body["email"], "otp": otp})
    client.post("/auth/login", json={"email": body["email"], "password": body["password"]})
    r_patch = client.patch(
        "/users/me",
        json={
            "org_name": "Acme Ltd",
            "logo_url": "/uploads/logos/test.png",
        },
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["user"]["org_name"] == "Acme Ltd"
    assert r_patch.json()["user"]["logo_url"] == "/uploads/logos/test.png"
    r_me = client.get("/auth/me")
    assert r_me.status_code == 200
    u = r_me.json()["user"]
    assert u["org_name"] == "Acme Ltd"
    assert u["logo_url"] == "/uploads/logos/test.png"


def test_login_invalid(client):
    r = client.post(
        "/auth/login",
        json={"email": "nope@test.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_login_unverified_blocked(client, db_session):
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    u = User(
        email="unverified@test.com",
        hashed_password=hash_password("password123"),
        role=UserRole.owner,
        email_verified_at=None,
    )
    db_session.add(u)
    db_session.commit()
    r = client.post(
        "/auth/login",
        json={"email": "unverified@test.com", "password": "password123"},
    )
    assert r.status_code == 403
    assert "verify" in r.json()["detail"].lower()


def test_logout(client):
    body = register_payload()
    client.post("/auth/register/request", json=body)
    otp = consume_last_test_otp()
    client.post("/auth/register/verify", json={"email": body["email"], "otp": otp})
    client.post("/auth/login", json={"email": body["email"], "password": body["password"]})
    client.post("/auth/logout")
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_register_legacy_rejected(client):
    r = client.post("/auth/register", json=register_payload())
    assert r.status_code == 400
    assert "register/request" in r.json()["detail"]


def test_register_password_mismatch(client):
    r = client.post(
        "/auth/register/request",
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
    assert client.post("/auth/register/request", json=body).status_code == 200
    otp = consume_last_test_otp()
    r_ver = client.post(
        "/auth/register/verify",
        json={"email": body["email"], "otp": otp},
    )
    assert r_ver.status_code == 200
    body2 = register_payload()
    body2["phone"] = body["phone"]
    r = client.post("/auth/register/request", json=body2)
    assert r.status_code == 400
    assert "phone" in r.json()["detail"].lower()


def test_register_resend_too_soon(client):
    body = register_payload()
    assert client.post("/auth/register/request", json=body).status_code == 200
    r = client.post("/auth/register/resend", json={"email": body["email"]})
    assert r.status_code == 429
    d = r.json()["detail"]
    assert d["wait_seconds"] > 0


def test_register_otp_status_after_request(client):
    body = register_payload()
    assert client.post("/auth/register/request", json=body).status_code == 200
    r = client.get("/auth/register/otp-status", params={"email": body["email"]})
    assert r.status_code == 200
    j = r.json()
    assert j["wait_seconds"] >= 0
    assert j["can_resend"] is False
    assert j["exhausted"] is False
    assert j["sends_used"] == 1


def test_register_otp_status_404(client):
    r = client.get("/auth/register/otp-status", params={"email": "missing@test.com"})
    assert r.status_code == 404


def test_register_resend_exhausted(client, db_session):
    from app.core.security import hash_password, hash_token
    from app.models.registration_pending import RegistrationPending

    now = datetime.now(UTC)
    db_session.add(
        RegistrationPending(
            email="exhausted@test.com",
            otp_hash=hash_token("000000"),
            expires_at=now + timedelta(minutes=15),
            first_name="A",
            last_name="B",
            phone="+1999000111",
            hashed_password=hash_password("password123"),
            otp_send_count=5,
            last_otp_sent_at=now,
        )
    )
    db_session.commit()
    r = client.post("/auth/register/resend", json={"email": "exhausted@test.com"})
    assert r.status_code == 429
    assert r.json()["detail"]["exhausted"] is True
