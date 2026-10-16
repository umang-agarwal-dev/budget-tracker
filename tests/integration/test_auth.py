USER = {"email": "a@example.com", "name": "Alice", "password": "secret123"}


def test_register_returns_user_without_password(client):
    res = client.post("/auth/register", json=USER)
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "a@example.com"
    assert "password" not in body
    assert "password_hash" not in body


def test_duplicate_email_ignores_capitals(client):
    client.post("/auth/register", json=USER)
    again = {**USER, "email": "A@EXAMPLE.COM"}
    assert client.post("/auth/register", json=again).status_code == 409


def test_short_password_is_rejected(client):
    res = client.post("/auth/register", json={**USER, "password": "abc"})
    assert res.status_code == 422


def test_login_returns_token(client):
    client.post("/auth/register", json=USER)
    res = client.post(
        "/auth/login", data={"username": USER["email"], "password": USER["password"]}
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_wrong_password_is_rejected(client):
    client.post("/auth/register", json=USER)
    res = client.post(
        "/auth/login", data={"username": USER["email"], "password": "wrongpass"}
    )
    assert res.status_code == 401


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_returns_current_user(client, make_user):
    headers = make_user()
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "a@example.com"

def test_user_can_change_their_name(client, make_user):
    headers = make_user()
    res = client.patch("/auth/me", json={"name": "  Umang  "}, headers=headers)
    assert res.status_code == 200 and res.json()["name"] == "Umang"
    assert client.get("/auth/me", headers=headers).json()["name"] == "Umang"

def test_user_can_delete_their_account(client, make_user):
    headers = make_user()
    client.post("/expenses", json={"amount": 10, "category": "food"}, headers=headers)
    assert client.delete("/auth/me", headers=headers).status_code == 204
    assert client.get("/auth/me", headers=headers).status_code == 401