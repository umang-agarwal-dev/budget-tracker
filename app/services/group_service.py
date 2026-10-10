import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.group import Group, GroupMember
from app.models.user import User

MAX_MEMBERS = 20


class JoinError(Exception):
    pass


def create_group(db: Session, user: User, name: str) -> Group:
    group = Group(
        name=name,
        created_by=user.id,
        invite_token=secrets.token_urlsafe(16),
    )
    db.add(group)
    db.flush()
    db.add(
        GroupMember(
            group_id=group.id,
            name=user.name,
            user_id=user.id,
            member_token=secrets.token_urlsafe(32),
        )
    )
    db.commit()
    db.refresh(group)
    return group


def get_group_by_token(db: Session, token: str) -> Group | None:
    return db.scalar(select(Group).where(Group.invite_token == token))


def get_group_for_user(db: Session, user_id: int, group_id: int) -> Group | None:
    return db.scalar(
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(Group.id == group_id, GroupMember.user_id == user_id)
    )


def list_groups_for_user(db: Session, user_id: int) -> list[Group]:
    return list(
        db.scalars(
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user_id)
            .order_by(Group.id.desc())
        )
    )


def list_members(db: Session, group_id: int) -> list[GroupMember]:
    return list(
        db.scalars(
            select(GroupMember)
            .where(GroupMember.group_id == group_id)
            .order_by(GroupMember.id)
        )
    )


def join_group(db: Session, group: Group, name: str) -> GroupMember:
    members = list_members(db, group.id)
    if len(members) >= MAX_MEMBERS:
        raise JoinError("This group is full")
    if any(m.name.lower() == name.lower() for m in members):
        raise JoinError("That name is already taken in this group")

    member = GroupMember(
        group_id=group.id,
        name=name,
        member_token=secrets.token_urlsafe(32),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def group_view(db: Session, group: Group) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "invite_link": f"{settings.FRONTEND_URL}/join/{group.invite_token}",
        "members": list_members(db, group.id),
    }