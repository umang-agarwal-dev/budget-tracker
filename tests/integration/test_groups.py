from decimal import Decimal


def create_group(client, headers, name="Trip"):
    body = client.post("/groups", json={"name": name}, headers=headers).json()
    return body["id"], body["invite_link"].rsplit("/", 1)[1]


def join(client, token, name):
    return client.post(f"/groups/join/{token}", json={"name": name}).json()


def settled_group(client, headers):
    group_id, token = create_group(client, headers)
    rahul = join(client, token, "Rahul")
    join(client, token, "Priya")
    client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 3000, "description": "hotel"},
        headers=headers,
    )
    client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 600, "description": "cab"},
        headers={"X-Member-Token": rahul["member_token"]},
    )
    res = client.post(f"/groups/{group_id}/settle", headers=headers)
    return group_id, token, rahul, res


def test_guest_can_join_but_not_with_a_taken_name(client, make_user):
    headers = make_user()
    _, token = create_group(client, headers)
    assert client.post(f"/groups/join/{token}", json={"name": "Rahul"}).status_code == 201
    again = client.post(f"/groups/join/{token}", json={"name": "rahul"})
    assert again.status_code == 409


def test_member_token_decides_who_paid(client, make_user):
    headers = make_user()
    group_id, token = create_group(client, headers)
    rahul = join(client, token, "Rahul")

    res = client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 500, "description": "snacks"},
        headers={"X-Member-Token": rahul["member_token"]},
    )
    assert res.status_code == 201
    assert res.json()["paid_by_name"] == "Rahul"


def test_wrong_member_token_is_rejected(client, make_user):
    headers = make_user()
    group_id, _ = create_group(client, headers)
    res = client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 500, "description": "snacks"},
        headers={"X-Member-Token": "not-a-real-token"},
    )
    assert res.status_code == 401


def test_cannot_delete_someone_elses_expense(client, make_user):
    headers = make_user()
    group_id, token = create_group(client, headers)
    rahul = join(client, token, "Rahul")
    expense = client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 500, "description": "dinner"},
        headers=headers,
    ).json()
    url = f"/groups/{group_id}/expenses/{expense['id']}"

    rahuls_headers = {"X-Member-Token": rahul["member_token"]}
    assert client.delete(url, headers=rahuls_headers).status_code == 403
    assert client.delete(url, headers=headers).status_code == 204


def test_settlement_says_who_pays_whom(client, make_user):
    headers = make_user()
    _, _, _, res = settled_group(client, headers)
    assert res.status_code == 201

    payments = {
        (p["from_name"], p["to_name"]): Decimal(p["amount"])
        for p in res.json()["payments"]
    }
    assert payments == {
        ("Priya", "Alice"): Decimal("1200"),
        ("Rahul", "Alice"): Decimal("600"),
    }


def test_group_is_locked_after_settling(client, make_user):
    headers = make_user()
    group_id, token, rahul, _ = settled_group(client, headers)

    late = client.post(
        f"/groups/{group_id}/expenses",
        json={"amount": 100, "description": "late"},
        headers=headers,
    )
    assert late.status_code == 409
    assert client.post(f"/groups/join/{token}", json={"name": "Late"}).status_code == 409
    assert client.post(f"/groups/{group_id}/settle", headers=headers).status_code == 409

    seen = client.get(
        f"/groups/{group_id}/settlement",
        headers={"X-Member-Token": rahul["member_token"]},
    )
    assert seen.status_code == 200
    assert "pays" in seen.json()["message"]


def test_outsider_cannot_settle(client, make_user):
    alice = make_user("a@example.com", "Alice")
    bob = make_user("b@example.com", "Bob")
    group_id, _ = create_group(client, alice)
    assert client.post(f"/groups/{group_id}/settle", headers=bob).status_code == 404


def test_cannot_settle_an_empty_group(client, make_user):
    headers = make_user()
    group_id, _ = create_group(client, headers)
    assert client.post(f"/groups/{group_id}/settle", headers=headers).status_code == 400