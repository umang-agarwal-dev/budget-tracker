from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.budget import BudgetRead, BudgetSet
from app.services import budget_service

router = APIRouter(prefix="/budget", tags=["budget"])


@router.put("", response_model=BudgetRead)
def set_budget(
    data: BudgetSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return budget_service.set_budget(db, current_user.id, data.amount)


@router.get("", response_model=BudgetRead)
def get_budget(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = budget_service.get_budget(db, current_user.id)
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No budget set for this month",
        )
    return budget