import datetime

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AIAdviceLog(Base):
    __tablename__ = "ai_advice_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    goal_id: Mapped[int] = mapped_column(
        ForeignKey("savings_goals.id", ondelete="CASCADE")
    )
    date: Mapped[datetime.date] = mapped_column(Date, index=True)
    advice: Mapped[str] = mapped_column(Text)