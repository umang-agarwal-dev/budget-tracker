from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupPreview,
    GroupRead,
    JoinResult,
    MemberJoin,
)
from app.services import group_service

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_service.create_group(db, current_user, data.name)
    return group_service.group_view(db, group)


@router.get("", response_model=list[GroupRead])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groups = group_service.list_groups_for_user(db, current_user.id)
    return [group_service.group_view(db, g) for g in groups]


@router.get("/join/{token}", response_model=GroupPreview)
def preview_group(token: str, db: Session = Depends(get_db)):
    group = group_service.get_group_by_token(db, token)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite link")
    return {
        "name": group.name,
        "member_count": len(group_service.list_members(db, group.id)),
    }


@router.post(
    "/join/{token}", response_model=JoinResult, status_code=status.HTTP_201_CREATED
)
def join_group(token: str, data: MemberJoin, db: Session = Depends(get_db)):
    group = group_service.get_group_by_token(db, token)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite link")
    try:
        member = group_service.join_group(db, group, data.name)
    except group_service.JoinError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc))
    return {
        "member_id": member.id,
        "name": member.name,
        "member_token": member.member_token,
        "group_name": group.name,
    }


@router.get("/{group_id}", response_model=GroupRead)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_service.get_group_for_user(db, current_user.id, group_id)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    return group_service.group_view(db, group)