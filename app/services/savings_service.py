import datetime
import math
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal, SavingsLog
from app.schemas.savings import GoalCreate, LogCreate
from app.services import budget_service


def create_goal(db: Session, user_id: int, data: GoalCreate) -> SavingsGoal:
    goal = SavingsGoal(
        user_id=user_id,
        purpose=data.purpose.strip(),
        target_amount=data.target_amount,
        target_date=data.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_goal(db: Session, user_id: int, goal_id: int) -> SavingsGoal | None:
    return db.scalar(
        select(SavingsGoal).where(
            SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id
        )
    )


def list_goals(db: Session, user_id: int) -> list[SavingsGoal]:
    return list(
        db.scalars(
            select(SavingsGoal)
            .where(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.target_date)
        )
    )


def add_log(db: Session, goal: SavingsGoal, data: LogCreate) -> SavingsLog:
    log = SavingsLog(
        goal_id=goal.id,
        amount=data.amount,
        date=data.date or datetime.date.today(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_saved(db: Session, goal_id: int) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(SavingsLog.amount), 0)).where(
            SavingsLog.goal_id == goal_id
        )
    )
    return Decimal(total)


def goal_view(db: Session, goal: SavingsGoal) -> dict:
    saved = get_saved(db, goal.id)
    remaining = max(goal.target_amount - saved, Decimal(0))
    days_left = (goal.target_date - datetime.date.today()).days
    months_left = max(1, math.ceil(days_left / 30))
    monthly_needed = (remaining / months_left).quantize(Decimal("0.01"))
    return {
        "id": goal.id,
        "purpose": goal.purpose,
        "target_amount": goal.target_amount,
        "target_date": goal.target_date,
        "saved": saved,
        "remaining": remaining,
        "months_left": months_left,
        "monthly_needed": monthly_needed,
    }

def build_advice_facts(db: Session, user_id: int, goal: SavingsGoal) -> dict | None:
    budget = budget_service.get_budget(db, user_id)
    if budget is None:
        return None

    view = goal_view(db, goal)
    spent = budget_service.get_spent(db, user_id)
    days_passed = datetime.date.today().day
    days_in_month = budget_service.month_end().day
    projected_spend = (spent / days_passed * days_in_month).quantize(Decimal("0.01"))
    projected_leftover = budget.amount - projected_spend
    shortfall = max(view["monthly_needed"] - projected_leftover, Decimal(0))

    return {
        "monthly_budget": budget.amount,
        "spent_so_far": spent,
        "days_passed": days_passed,
        "days_in_month": days_in_month,
        "projected_month_spend": projected_spend,
        "projected_leftover": projected_leftover,
        "overspending": projected_spend > budget.amount,
        "shortfall": shortfall,
        "top_categories": [
            {
                "category": c,
                "spent": t,
                "cut_10": (t * Decimal("0.10")).quantize(Decimal("0.01")),
                "cut_20": (t * Decimal("0.20")).quantize(Decimal("0.01")),
            }
            for c, t in budget_service.get_category_totals(db, user_id)
        ],
        "goal": goal.purpose,
        "goal_remaining": view["remaining"],
        "months_left": view["months_left"],
        "monthly_needed": view["monthly_needed"],
    }