import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group import GroupExpense, GroupExpenseParticipant, GroupMember
from app.schemas.group import GroupExpenseCreate


class InvalidSplitError(Exception):
    pass


def add_expense(db: Session, group_id: int, member: GroupMember, data: GroupExpenseCreate) -> GroupExpense:
    ids = sorted(set(data.split_among or []))          # remove duplicates; empty means everyone
    if ids:
        found = set(db.scalars(
            select(GroupMember.id).where(GroupMember.group_id == group_id, GroupMember.id.in_(ids))
        ))
        if found != set(ids):
            raise InvalidSplitError("Some of those people are not in this group")

    expense = GroupExpense(
        group_id=group_id,
        paid_by=member.id,
        amount=data.amount,
        description=data.description,
        date=data.date or datetime.date.today(),
    )
    
    db.add(expense)
    db.flush()                                          # sends the INSERT so expense.id exists
    db.add_all(GroupExpenseParticipant(group_expense_id=expense.id, member_id=m) for m in ids)
    db.commit()                                         # expense and sharers saved together, or not at all
    db.refresh(expense)
    return expense


def describe(db: Session, expenses: list[GroupExpense]) -> list[dict]:
    """Adds the payer's name and the sharers to each expense, using only two queries."""
    if not expenses:
        return []
    names = {m.id: m.name for m in db.scalars(
        select(GroupMember).where(GroupMember.group_id == expenses[0].group_id))}
    parts: dict[int, list[int]] = {}
    for eid, mid in db.execute(
        select(GroupExpenseParticipant.group_expense_id, GroupExpenseParticipant.member_id)
        .where(GroupExpenseParticipant.group_expense_id.in_([e.id for e in expenses]))
    ):
        parts.setdefault(eid, []).append(mid)
    return [{
        "id": e.id, "amount": e.amount, "description": e.description, "date": e.date,
        "paid_by_id": e.paid_by, "paid_by_name": names[e.paid_by],
        "split_all": e.id not in parts,
        "participants": [{"id": m, "name": names[m]} for m in sorted(parts.get(e.id, []))],
    } for e in expenses]


def list_expenses(db: Session, group_id: int) -> list[dict]:
    rows = list(db.scalars(
        select(GroupExpense).where(GroupExpense.group_id == group_id)
        .order_by(GroupExpense.date.desc(), GroupExpense.id.desc())
    ))
    return describe(db, rows)


def get_expense(db: Session, group_id: int, expense_id: int) -> GroupExpense | None:
    return db.scalar(select(GroupExpense).where(GroupExpense.id == expense_id, GroupExpense.group_id == group_id))


def delete_expense(db: Session, expense: GroupExpense) -> None:
    db.delete(expense)
    db.commit()