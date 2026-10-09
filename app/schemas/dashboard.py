from decimal import Decimal

from pydantic import BaseModel


class DashboardRead(BaseModel):
    budget: Decimal
    spent: Decimal
    amount_left: Decimal
    days_left: int
    overspent: bool