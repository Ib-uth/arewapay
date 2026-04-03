import uuid


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
