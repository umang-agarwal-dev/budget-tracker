from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group import Group, GroupExpense, GroupMember, Settlement,GroupExpenseParticipant


# ---------- pure math (no database, no AI) ----------


def compute_totals(member_ids, expenses):
    """expenses: (expense_id, paid_by, paise, participants). participants None or [] = everyone.
    Returns (paid, owed) per member, in paise."""
    ids = sorted(member_ids)
    paid = {m: 0 for m in ids}
    owed = {m: 0 for m in ids}
    for expense_id, paid_by, cents, participants in expenses:
        sharers = sorted(participants) if participants else ids
        n = len(sharers)
        paid[paid_by] += cents
        share, extra = divmod(cents, n)
        for m in sharers:
            owed[m] += share
        for k in range(extra):                          # leftover paise, rotated between sharers
            owed[sharers[(expense_id + k) % n]] += 1
    return paid, owed


def compute_balances(member_ids, expenses):
    paid, owed = compute_totals(member_ids, expenses)
    return {m: paid[m] - owed[m] for m in paid}


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

    rows = db.execute(select(GroupExpense.id, GroupExpense.paid_by, GroupExpense.amount)
                      .where(GroupExpense.group_id == group.id)).all()
    if not rows:
        raise NothingToSettleError

    parts: dict[int, list[int]] = {}
    for eid, mid in db.execute(
        select(GroupExpenseParticipant.group_expense_id, GroupExpenseParticipant.member_id)
        .where(GroupExpenseParticipant.group_expense_id.in_([r[0] for r in rows]))
    ):
        parts.setdefault(eid, []).append(mid)

    names = {m.id: m.name for m in members}
    expenses = [(eid, paid_by, int(amount * 100), parts.get(eid)) for eid, paid_by, amount in rows]
    paid, owed = compute_totals(list(names), expenses)
    balances = {m: paid[m] - owed[m] for m in names}
    payments = simplify(balances)

    result = {
        "total_spent": _rupees(sum(cents for _, _, cents, _ in expenses)),
        "balances": [
            {"member_id": m, "name": names[m], "balance": _rupees(b),
             "paid": _rupees(paid[m]), "owed": _rupees(owed[m])}
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

def unlock(db: Session, group_id: int) -> bool:
    settlement = get_settlement(db, group_id)
    if settlement is None:
        return False
    db.delete(settlement)
    db.commit()
    return True