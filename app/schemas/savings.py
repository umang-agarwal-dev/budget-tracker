import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class GoalCreate(BaseModel):
    purpose: str = Field(min_length=1, max_length=100)
    target_amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    target_date: datetime.date

    @field_validator("target_date")
    @classmethod
    def must_be_future(cls, value: datetime.date) -> datetime.date:
        if value <= datetime.date.today():
            raise ValueError("target_date must be in the future")
        return value


class GoalRead(BaseModel):
    id: int
    purpose: str
    target_amount: Decimal
    target_date: datetime.date
    saved: Decimal
    remaining: Decimal
    months_left: int
    monthly_needed: Decimal


class LogCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    date: datetime.date | None = None


class LogRead(BaseModel):
    id: int
    amount: Decimal
    date: datetime.date

    model_config = {"from_attributes": True}

class AdviceRead(BaseModel):
    advice: str