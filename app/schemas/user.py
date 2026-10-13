from pydantic import BaseModel, EmailStr, Field
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, StringConstraints

class UserUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str

    model_config = {"from_attributes": True}