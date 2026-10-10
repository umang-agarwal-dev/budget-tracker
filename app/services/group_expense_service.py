import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.group import GroupExpense, GroupMember
from app.schemas.group import GroupExpenseCreate


def expense_view(expense: GroupExpense, paid_by_name: str) -> dict:
    return {
        "id": expense.id,
        "amount": expense.amount,
        "description": expense.description,
        "date": expense.date,
        "paid_by_id": expense.paid_by,
        "paid_by_name": paid_by_name,
    }


def add_expense(
    db: Session, group_id: int, member: GroupMember, data: GroupExpenseCreate
) -> GroupExpense:
    expense = GroupExpense(
        group_id=group_id,
        paid_by=member.id,
        amount=data.amount,
        description=data.description,
        date=data.date or datetime.date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(db: Session, group_id: int) -> list[dict]:
    rows = db.execute(
        select(GroupExpense, GroupMember.name)
        .join(GroupMember, GroupMember.id == GroupExpense.paid_by)
        .where(GroupExpense.group_id == group_id)
        .order_by(GroupExpense.date.desc(), GroupExpense.id.desc())
    ).all()
    return [expense_view(expense, name) for expense, name in rows]


def get_expense(db: Session, group_id: int, expense_id: int) -> GroupExpense | None:
    return db.scalar(
        select(GroupExpense).where(
            GroupExpense.id == expense_id, GroupExpense.group_id == group_id
        )
    )


def delete_expense(db: Session, expense: GroupExpense) -> None:
    db.delete(expense)
    db.commit()