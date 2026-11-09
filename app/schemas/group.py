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
    settled: bool = False
    settled_at: datetime.datetime | None = None
    total_spent: Decimal | None = None


class GroupPreview(BaseModel):
    group_id: int
    name: str
    member_count: int


class JoinResult(BaseModel):
    group_id: int
    member_id: int
    name: str
    member_token: str
    group_name: str

class GroupExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    date: datetime.date | None = None
    split_among: list[int] | None = Field(default=None, max_length=20)  #member ids; leave out = everyone



class GroupExpenseRead(BaseModel):
    id: int
    amount: Decimal
    description: str
    date: datetime.date
    paid_by_id: int
    paid_by_name: str
    split_all: bool                    
    participants: list[MemberRead]     #empty when split_all is true

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
    paid: Decimal | None = None        # total this person paid
    owed: Decimal | None = None        # total this person's share


class SettlementRead(BaseModel):
    group_name: str
    generated_at: datetime.datetime
    total_spent: Decimal
    balances: list[BalanceRead]
    payments: list[PaymentRead]
    message: str