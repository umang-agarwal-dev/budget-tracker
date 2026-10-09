import calendar
import math
import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.expense import Expense


def current_month() -> datetime.date:
    return datetime.date.today().replace(day=1)


def month_end() -> datetime.date:
    start = current_month()
    last_day = calendar.monthrange(start.year, start.month)[1]
    return start.replace(day=last_day)


def get_budget(db: Session, user_id: int) -> Budget | None:
    return db.scalar(
        select(Budget).where(
            Budget.user_id == user_id, Budget.month == current_month()
        )
    )


def set_budget(db: Session, user_id: int, amount: Decimal) -> Budget:
    budget = get_budget(db, user_id)
    if budget:
        budget.amount = amount
    else:
        budget = Budget(user_id=user_id, month=current_month(), amount=amount)
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_spent(db: Session, user_id: int) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.date >= current_month(),
            Expense.date <= month_end(),
        )
    )
    return Decimal(total)


def get_dashboard(db: Session, user_id: int) -> dict | None:
    budget = get_budget(db, user_id)
    if budget is None:
        return None
    spent = get_spent(db, user_id)
    return {
        "budget": budget.amount,
        "spent": spent,
        "amount_left": budget.amount - spent,
        "days_left": (month_end() - datetime.date.today()).days + 1,
        "overspent": spent > budget.amount,
    }

def _level(total: Decimal, max_total: Decimal) -> int:
    if total <= 0 or max_total <= 0:
        return 0
    return min(4, max(1, math.ceil(total / max_total * 4)))


def get_heatmap(db: Session, user_id: int) -> dict:
    start = current_month()
    end = month_end()

    rows = db.execute(
        select(Expense.date, func.sum(Expense.amount))
        .where(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
        )
        .group_by(Expense.date)
    ).all()

    totals = {day: Decimal(total) for day, total in rows}
    max_total = max(totals.values(), default=Decimal(0))

    days = []
    for n in range(end.day):
        day = start + datetime.timedelta(days=n)
        total = totals.get(day, Decimal(0))
        days.append({"date": day, "total": total, "level": _level(total, max_total)})

    return {"month": start, "max_day_total": max_total, "days": days}