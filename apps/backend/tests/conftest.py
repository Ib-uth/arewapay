import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-pytest-only-32chars")
os.environ.setdefault("REVENUECAT_WEBHOOK_SECRET", "test-webhook-secret")
os.environ.setdefault("REVENUECAT_PREMIUM_PRODUCT_IDS", "premium_monthly,premium_yearly")
os.environ.setdefault("REVENUECAT_UNLIMITED_PRODUCT_IDS", "lifetime")

from app.config import settings  # noqa: E402
from app.core.limiter import limiter  # noqa: E402
from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Client, Invoice, InvoiceItem, Payment, RefreshToken, User  # noqa: E402, F401


@pytest.fixture(scope="session")
def engine():
    url = settings.database_url
    kw: dict = {}
    if url.startswith("sqlite"):
        kw["connect_args"] = {"check_same_thread": False}
        kw["poolclass"] = StaticPool
    else:
        kw["poolclass"] = NullPool
    eng = create_engine(url, **kw)
    Base.metadata.drop_all(bind=eng)
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture
def db_session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db_session):
    def _get_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _disable_rate_limits():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture(autouse=True)
def _clean_tables(db_session):
    yield
    if settings.database_url.startswith("sqlite"):
        db_session.execute(text("DELETE FROM payments"))
        db_session.execute(text("DELETE FROM invoice_items"))
        db_session.execute(text("DELETE FROM invoices"))
        db_session.execute(text("DELETE FROM clients"))
        db_session.execute(text("DELETE FROM refresh_tokens"))
        db_session.execute(text("DELETE FROM users"))
    else:
        db_session.execute(
            text(
                "TRUNCATE TABLE payments, invoice_items, invoices, clients, refresh_tokens, users "
                "RESTART IDENTITY CASCADE"
            )
        )
    db_session.commit()
