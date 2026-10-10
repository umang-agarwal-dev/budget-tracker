import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.deps import get_db
from app.core.limiter import limiter
from app.db.base import Base
from app.main import app
from app.models import ai_usage, budget, expense, group, savings_goal, user  # noqa: F401

TEST_DATABASE_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + "/budget_tracker_test"
assert TEST_DATABASE_URL.endswith("_test")

test_engine = create_engine(TEST_DATABASE_URL)
TestSession = sessionmaker(bind=test_engine)

limiter.enabled = False


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)
    yield
    test_engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    names = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    with test_engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def make_user(client):
    def _make(email="a@example.com", name="Alice"):
        client.post(
            "/auth/register",
            json={"email": email, "name": name, "password": "secret123"},
        )
        res = client.post(
            "/auth/login", data={"username": email, "password": "secret123"}
        )
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return _make