import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=255)
    date: datetime.date | None = None


class ExpenseRead(BaseModel):
    id: int
    amount: Decimal
    category: str
    description: str | None
    date: datetime.date

    model_config = {"from_attributes": True}