import calendar
import datetime
from decimal import Decimal


def test_dashboard_needs_a_budget(client, make_user):
    headers = make_user()
    assert client.get("/dashboard", headers=headers).status_code == 404


def test_amount_left_is_budget_minus_spent(client, make_user):
    headers = make_user()
    client.put("/budget", json={"amount": 10000}, headers=headers)
    client.post("/expenses", json={"amount": 250, "category": "Food"}, headers=headers)
    client.post("/expenses", json={"amount": 1000, "category": "travel"}, headers=headers)

    data = client.get("/dashboard", headers=headers).json()
    assert Decimal(data["spent"]) == 1250
    assert Decimal(data["amount_left"]) == 8750
    assert data["overspent"] is False


def test_overspending_goes_negative(client, make_user):
    headers = make_user()
    client.put("/budget", json={"amount": 100}, headers=headers)
    client.post("/expenses", json={"amount": 150, "category": "food"}, headers=headers)

    data = client.get("/dashboard", headers=headers).json()
    assert Decimal(data["amount_left"]) == -50
    assert data["overspent"] is True


def test_last_months_expense_is_not_counted(client, make_user):
    headers = make_user()
    last_month = (
        datetime.date.today().replace(day=1) - datetime.timedelta(days=1)
    ).isoformat()
    client.put("/budget", json={"amount": 5000}, headers=headers)
    client.post(
        "/expenses",
        json={"amount": 999, "category": "food", "date": last_month},
        headers=headers,
    )

    data = client.get("/dashboard", headers=headers).json()
    assert Decimal(data["spent"]) == 0


def test_negative_amount_is_rejected(client, make_user):
    headers = make_user()
    res = client.post("/expenses", json={"amount": -5, "category": "food"}, headers=headers)
    assert res.status_code == 422


def test_users_cannot_see_each_others_expenses(client, make_user):
    alice = make_user("a@example.com", "Alice")
    bob = make_user("b@example.com", "Bob")
    client.post("/expenses", json={"amount": 100, "category": "food"}, headers=alice)

    assert len(client.get("/expenses", headers=alice).json()) == 1
    assert client.get("/expenses", headers=bob).json() == []


def test_heatmap_marks_biggest_day_darkest(client, make_user):
    headers = make_user()
    today = datetime.date.today()
    client.post("/expenses", json={"amount": 500, "category": "food"}, headers=headers)

    data = client.get("/dashboard/heatmap", headers=headers).json()
    assert len(data["days"]) == calendar.monthrange(today.year, today.month)[1]
    day = next(d for d in data["days"] if d["date"] == today.isoformat())
    assert day["level"] == 4