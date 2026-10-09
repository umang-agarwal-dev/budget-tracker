import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetSet(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class BudgetRead(BaseModel):
    month: datetime.date
    amount: Decimal

    model_config = {"from_attributes": True}