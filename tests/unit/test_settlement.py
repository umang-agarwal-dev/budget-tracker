from app.services.settlement_service import compute_balances, simplify


def test_one_person_paid_for_everyone():
    balances = compute_balances([1, 2, 3], [(1, 1, 300000, None)])
    assert balances == {1: 200000, 2: -100000, 3: -100000}
    assert sorted(simplify(balances)) == [(2, 1, 100000), (3, 1, 100000)]


def test_balances_always_sum_to_zero():
    balances = compute_balances([1, 2, 3], [(1, 1, 1000, None), (2, 2, 1, None), (3, 3, 5, None)])
    assert sum(balances.values()) == 0


def test_evenly_paid_needs_no_payments():
    balances = compute_balances([1, 2], [(1, 1, 500, None), (2, 2, 500, None)])
    assert simplify(balances) == []


def test_middleman_drops_out():
    assert simplify({1: -10000, 2: 0, 3: 10000}) == [(1, 3, 10000)]

def test_selected_people_split_only_among_themselves():
    # 1=Alice, 2=Rahul, 3=Priya. Dinner 900 by Alice for Alice+Rahul, cab 600 by Rahul for everyone
    balances = compute_balances([1, 2, 3], [(1, 1, 90000, [1, 2]), (2, 2, 60000, None)])
    assert balances == {1: 25000, 2: -5000, 3: -20000}
    assert sorted(simplify(balances)) == [(2, 1, 5000), (3, 1, 20000)]


def test_payer_does_not_have_to_be_in_the_split():
    balances = compute_balances([1, 2, 3], [(1, 1, 60000, [2, 3])])
    assert balances == {1: 60000, 2: -30000, 3: -30000}