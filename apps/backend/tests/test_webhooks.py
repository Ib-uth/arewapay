from tests.helpers import register_and_login


def _register(client):
    register_and_login(client)
    r = client.get("/auth/me")
    assert r.status_code == 200
    return r.json()["user"]["id"]


def test_revenuecat_webhook_rejects_bad_auth(client):
    r = client.post("/webhooks/revenuecat", json={}, headers={"Authorization": "Bearer wrong"})
    assert r.status_code == 401


def test_revenuecat_webhook_sets_premium(client):
    uid = _register(client)
    r = client.post(
        "/webhooks/revenuecat",
        json={
            "event": {
                "type": "INITIAL_PURCHASE",
                "app_user_id": uid,
                "product_id": "premium_monthly",
                "expiration_at_ms": 1893456000000,
            }
        },
        headers={"Authorization": "Bearer test-webhook-secret"},
    )
    assert r.status_code == 200
    u = client.get("/auth/me").json()["user"]
    assert u["subscription_tier"] == "premium"
    assert u["subscription_expires_at"] is not None


def test_revenuecat_webhook_sets_unlimited(client):
    uid = _register(client)
    r = client.post(
        "/webhooks/revenuecat",
        json={
            "event": {
                "type": "INITIAL_PURCHASE",
                "app_user_id": uid,
                "product_id": "lifetime",
            }
        },
        headers={"Authorization": "Bearer test-webhook-secret"},
    )
    assert r.status_code == 200
    u = client.get("/auth/me").json()["user"]
    assert u["subscription_tier"] == "unlimited"
    assert u["subscription_expires_at"] is None


def test_revenuecat_webhook_expiration_downgrades(client):
    uid = _register(client)
    client.post(
        "/webhooks/revenuecat",
        json={
            "event": {
                "type": "INITIAL_PURCHASE",
                "app_user_id": uid,
                "product_id": "premium_monthly",
                "expiration_at_ms": 1893456000000,
            }
        },
        headers={"Authorization": "Bearer test-webhook-secret"},
    )
    r = client.post(
        "/webhooks/revenuecat",
        json={
            "event": {
                "type": "EXPIRATION",
                "app_user_id": uid,
                "product_id": "premium_monthly",
            }
        },
        headers={"Authorization": "Bearer test-webhook-secret"},
    )
    assert r.status_code == 200
    u = client.get("/auth/me").json()["user"]
    assert u["subscription_tier"] == "free"
