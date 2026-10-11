import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate


def create_expense(db: Session, user_id: int, data: ExpenseCreate) -> Expense:
    expense = Expense(
        user_id=user_id,
        amount=data.amount,
        category=data.category.strip().lower(),
        description=data.description,
        date=data.date or datetime.date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(db: Session, user_id: int) -> list[Expense]:
    return list(
        db.scalars(
            select(Expense)
            .where(Expense.user_id == user_id)
            .order_by(Expense.date.desc(), Expense.id.desc())
        )
    )

def delete_expense(db: Session, user_id: int, expense_id: int) -> bool:
    expense = db.scalar(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    if expense is None:
        return False
    db.delete(expense)
    db.commit()
    return True