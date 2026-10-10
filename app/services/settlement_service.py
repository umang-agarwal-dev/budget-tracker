from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group import Group, GroupExpense, GroupMember, Settlement


# ---------- pure math (no database, no AI) ----------


def compute_balances(
    member_ids: list[int], expenses: list[tuple[int, int, int]]
) -> dict[int, int]:
    """expenses: (expense_id, paid_by, amount_in_paise).
    Returns each member's balance in paise: positive = owed money, negative = owes."""
    ids = sorted(member_ids)
    n = len(ids)
    balances = {m: 0 for m in ids}
    for expense_id, paid_by, cents in expenses:
        balances[paid_by] += cents
        share, extra = divmod(cents, n)
        for m in ids:
            balances[m] -= share
        for k in range(extra):
            balances[ids[(expense_id + k) % n]] -= 1
    return balances


def simplify(balances: dict[int, int]) -> list[tuple[int, int, int]]:
    """Returns payments as (from_member, to_member, amount_in_paise)."""
    creditors = sorted(
        ([m, b] for m, b in balances.items() if b > 0), key=lambda x: (-x[1], x[0])
    )
    debtors = sorted(
        ([m, -b] for m, b in balances.items() if b < 0), key=lambda x: (-x[1], x[0])
    )
    payments = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        pay = min(debtors[i][1], creditors[j][1])
        payments.append((debtors[i][0], creditors[j][0], pay))
        debtors[i][1] -= pay
        creditors[j][1] -= pay
        if debtors[i][1] == 0:
            i += 1
        if creditors[j][1] == 0:
            j += 1
    return payments


# ---------- database side ----------


class NothingToSettleError(Exception):
    pass


def _rupees(paise: int) -> str:
    return f"{Decimal(paise) / 100:.2f}"


def get_settlement(db: Session, group_id: int) -> Settlement | None:
    return db.scalar(select(Settlement).where(Settlement.group_id == group_id))


def finalize(db: Session, group: Group) -> Settlement:
    members = db.scalars(
        select(GroupMember)
        .where(GroupMember.group_id == group.id)
        .order_by(GroupMember.id)
    ).all()
    rows = db.execute(
        select(GroupExpense.id, GroupExpense.paid_by, GroupExpense.amount).where(
            GroupExpense.group_id == group.id
        )
    ).all()
    if not rows:
        raise NothingToSettleError

    names = {m.id: m.name for m in members}
    expenses = [(eid, paid_by, int(amount * 100)) for eid, paid_by, amount in rows]
    balances = compute_balances(list(names), expenses)
    payments = simplify(balances)

    result = {
        "total_spent": _rupees(sum(cents for _, _, cents in expenses)),
        "balances": [
            {"member_id": m, "name": names[m], "balance": _rupees(b)}
            for m, b in balances.items()
        ],
        "payments": [
            {
                "from_id": f,
                "from_name": names[f],
                "to_id": t,
                "to_name": names[t],
                "amount": _rupees(a),
            }
            for f, t, a in payments
        ],
    }
    settlement = Settlement(group_id=group.id, result=result)
    db.add(settlement)
    db.commit()
    db.refresh(settlement)
    return settlement


def settlement_view(group: Group, settlement: Settlement) -> dict:
    result = settlement.result
    lines = [
        f"{p['from_name']} pays {p['to_name']} ₹{p['amount']}"
        for p in result["payments"]
    ]
    if lines:
        message = f"{group.name}: settle up\n" + "\n".join(lines)
    else:
        message = f"{group.name}: everyone is already settled up"
    return {
        "group_name": group.name,
        "generated_at": settlement.generated_at,
        "total_spent": result["total_spent"],
        "balances": result["balances"],
        "payments": result["payments"],
        "message": message,
    }