import datetime
from decimal import Decimal

from app.services import ai_service


def future_date(days=120):
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()


def make_goal(client, headers):
    res = client.post(
        "/savings/goals",
        json={"purpose": "Trip", "target_amount": 20000, "target_date": future_date()},
        headers=headers,
    )
    return res.json()


def test_goal_math(client, make_user):
    headers = make_user()
    goal = make_goal(client, headers)
    assert goal["months_left"] == 4
    assert Decimal(goal["monthly_needed"]) == 5000

    client.post(f"/savings/goals/{goal['id']}/logs", json={"amount": 3000}, headers=headers)
    goal = client.get(f"/savings/goals/{goal['id']}", headers=headers).json()
    assert Decimal(goal["saved"]) == 3000
    assert Decimal(goal["remaining"]) == 17000
    assert Decimal(goal["monthly_needed"]) == 4250


def test_other_users_goal_is_hidden(client, make_user):
    alice = make_user("a@example.com", "Alice")
    bob = make_user("b@example.com", "Bob")
    goal = make_goal(client, alice)
    assert client.get(f"/savings/goals/{goal['id']}", headers=bob).status_code == 404


def test_ai_advice_is_limited_to_two_per_day(client, make_user, monkeypatch):
    monkeypatch.setattr(ai_service, "savings_advice", lambda facts: "Cut food a bit.")
    headers = make_user()
    client.put("/budget", json={"amount": 5000}, headers=headers)
    client.post("/expenses", json={"amount": 900, "category": "food"}, headers=headers)
    goal = make_goal(client, headers)
    url = f"/savings/goals/{goal['id']}/advice"

    first = client.get(url, headers=headers)
    assert first.status_code == 200
    assert first.json()["source"] == "ai"
    assert first.json()["remaining_today"] == 1
    assert client.get(url, headers=headers).json()["remaining_today"] == 0
    assert client.get(url, headers=headers).status_code == 429


def test_fallback_when_ai_fails_does_not_use_up_a_try(client, make_user, monkeypatch):
    def broken(facts):
        raise ai_service.AIUnavailableError

    monkeypatch.setattr(ai_service, "savings_advice", broken)
    headers = make_user()
    client.put("/budget", json={"amount": 5000}, headers=headers)
    client.post("/expenses", json={"amount": 900, "category": "food"}, headers=headers)
    goal = make_goal(client, headers)

    res = client.get(f"/savings/goals/{goal['id']}/advice", headers=headers)
    assert res.status_code == 200
    assert res.json()["source"] == "basic"
    assert res.json()["remaining_today"] == 2