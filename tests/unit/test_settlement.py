from app.services.settlement_service import compute_balances, simplify


def test_one_person_paid_for_everyone():
    balances = compute_balances([1, 2, 3], [(1, 1, 300000)])
    assert balances == {1: 200000, 2: -100000, 3: -100000}
    assert sorted(simplify(balances)) == [(2, 1, 100000), (3, 1, 100000)]


def test_balances_always_sum_to_zero():
    balances = compute_balances([1, 2, 3], [(1, 1, 1000), (2, 2, 1), (3, 3, 5)])
    assert sum(balances.values()) == 0


def test_evenly_paid_needs_no_payments():
    balances = compute_balances([1, 2], [(1, 1, 500), (2, 2, 500)])
    assert simplify(balances) == []


def test_middleman_drops_out():
    assert simplify({1: -10000, 2: 0, 3: 10000}) == [(1, 3, 10000)]