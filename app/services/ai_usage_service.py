import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_usage import AIAdviceLog


def used_today(db: Session, user_id: int) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(AIAdviceLog)
            .where(
                AIAdviceLog.user_id == user_id,
                AIAdviceLog.date == datetime.date.today(),
            )
        )
        or 0
    )


def remaining_today(db: Session, user_id: int) -> int:
    return max(settings.AI_DAILY_LIMIT - used_today(db, user_id), 0)


def record_usage(db: Session, user_id: int, goal_id: int, advice: str) -> None:
    db.add(
        AIAdviceLog(
            user_id=user_id,
            goal_id=goal_id,
            date=datetime.date.today(),
            advice=advice,
        )
    )
    db.commit()