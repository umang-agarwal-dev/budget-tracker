from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, get_group_member
from app.core.limiter import limiter
from app.models.group import GroupMember
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupExpenseCreate,
    GroupExpenseRead,
    GroupPreview,
    GroupRead,
    JoinResult,
    MemberJoin,
    SettlementRead,
)
from app.services import group_expense_service, group_service, settlement_service

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
@limiter.limit("10/minute")
def join_group(
    request: Request, token: str, data: MemberJoin, db: Session = Depends(get_db)
):
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


@router.post(
    "/{group_id}/expenses",
    response_model=GroupExpenseRead,
    status_code=status.HTTP_201_CREATED,
)
def add_group_expense(
    group_id: int,
    data: GroupExpenseCreate,
    db: Session = Depends(get_db),
    member: GroupMember = Depends(get_group_member),
):
    if group_service.is_finalized(db, group_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "This group is already settled")

    expense = group_expense_service.add_expense(db, group_id, member, data)
    return group_expense_service.expense_view(expense, member.name)


@router.get("/{group_id}/expenses", response_model=list[GroupExpenseRead])
def list_group_expenses(
    group_id: int,
    db: Session = Depends(get_db),
    _: GroupMember = Depends(get_group_member),
):
    return group_expense_service.list_expenses(db, group_id)


@router.delete(
    "/{group_id}/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_group_expense(
    group_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    member: GroupMember = Depends(get_group_member),
):
    if group_service.is_finalized(db, group_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "This group is already settled")

    expense = group_expense_service.get_expense(db, group_id, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
    if expense.paid_by != member.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only delete your own expenses"
        )
    group_expense_service.delete_expense(db, expense)


@router.post(
    "/{group_id}/settle",
    response_model=SettlementRead,
    status_code=status.HTTP_201_CREATED,
)
def settle_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_service.get_group_for_user(db, current_user.id, group_id)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    if group.created_by != current_user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only the group admin can settle"
        )
    if group_service.is_finalized(db, group_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "This group is already settled")
    try:
        settlement = settlement_service.finalize(db, group)
    except settlement_service.NothingToSettleError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Add at least one expense first"
        )
    return settlement_service.settlement_view(group, settlement)


@router.get("/{group_id}/settlement", response_model=SettlementRead)
def get_settlement(
    group_id: int,
    db: Session = Depends(get_db),
    _: GroupMember = Depends(get_group_member),
):
    settlement = settlement_service.get_settlement(db, group_id)
    if settlement is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not settled yet")
    group = group_service.get_group(db, group_id)
    return settlement_service.settlement_view(group, settlement)