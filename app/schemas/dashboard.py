import datetime
from decimal import Decimal

from pydantic import BaseModel


class DashboardRead(BaseModel):
    budget: Decimal
    spent: Decimal
    amount_left: Decimal
    days_left: int
    overspent: bool


class HeatmapDay(BaseModel):
    date: datetime.date
    total: Decimal
    level: int


class HeatmapRead(BaseModel):
    month: datetime.date
    max_day_total: Decimal
    days: list[HeatmapDay]