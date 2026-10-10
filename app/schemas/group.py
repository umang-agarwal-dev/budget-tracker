from typing import Annotated

from pydantic import BaseModel, StringConstraints

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