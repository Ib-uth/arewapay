from tests.helpers import register_and_login


def test_patch_me_profile(client):
    register_and_login(client)
    r = client.patch(
        "/users/me",
        json={"theme": "dark", "currency_code": "kes", "country_code": "ke"},
    )
    assert r.status_code == 200
    u = r.json()["user"]
    assert u["theme"] == "dark"
    assert u["currency_code"] == "KES"
    assert u["country_code"] == "KE"


def test_onboarding_complete(client):
    register_and_login(client)
    r = client.post(
        "/users/me/onboarding",
        json={
            "display_name": "Acme Ltd",
            "company_name": "Acme Trading (Pty) Ltd",
            "country_code": "za",
            "currency_code": "zar",
            "survey": {"team_size": "2-10", "primary_goal": "Clearer receivables"},
        },
    )
    assert r.status_code == 200
    u = r.json()["user"]
    assert u["onboarding_completed_at"] is not None
    assert u["country_code"] == "ZA"
    assert u["currency_code"] == "ZAR"
    assert u["display_name"] == "Acme Ltd"


def test_delete_me(client):
    register_and_login(client)
    r = client.request(
        "DELETE",
        "/users/me",
        json={"password": "password123"},
    )
    assert r.status_code == 204
    r2 = client.get("/auth/me")
    assert r2.status_code == 401
