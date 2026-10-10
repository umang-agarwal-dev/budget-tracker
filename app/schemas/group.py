import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints
Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class GroupCreate(BaseModel):
    name: Name


class MemberJoin(BaseModel):
    name: Name


class MemberRead(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class GroupRead(BaseModel):
    id: int
    name: str
    invite_link: str
    members: list[MemberRead]


class GroupPreview(BaseModel):
    name: str
    member_count: int


class JoinResult(BaseModel):
    member_id: int
    name: str
    member_token: str
    group_name: str

class GroupExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    description: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)
    ]
    date: datetime.date | None = None


class GroupExpenseRead(BaseModel):
    id: int
    amount: Decimal
    description: str
    date: datetime.date
    paid_by_id: int
    paid_by_name: str

class PaymentRead(BaseModel):
    from_id: int
    from_name: str
    to_id: int
    to_name: str
    amount: Decimal


class BalanceRead(BaseModel):
    member_id: int
    name: str
    balance: Decimal


class SettlementRead(BaseModel):
    group_name: str
    generated_at: datetime.datetime
    total_spent: Decimal
    balances: list[BalanceRead]
    payments: list[PaymentRead]
    message: str