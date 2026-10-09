import datetime
import math
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal, SavingsLog
from app.schemas.savings import GoalCreate, LogCreate


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