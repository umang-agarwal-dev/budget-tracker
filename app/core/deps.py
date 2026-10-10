from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.group import GroupMember
from app.models.user import User
from app.services import group_service, user_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)
    user = user_service.get_user_by_id(db, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_group_member(
    group_id: int,
    x_member_token: str | None = Header(default=None),
    token: str | None = Depends(oauth2_optional),
    db: Session = Depends(get_db),
) -> GroupMember:
    member = None
    if x_member_token:
        member = group_service.get_member_by_token(db, group_id, x_member_token)
    elif token:
        user_id = decode_access_token(token)
        if user_id is not None:
            member = group_service.get_member_by_user(db, group_id, user_id)

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not a member of this group",
        )
    return member