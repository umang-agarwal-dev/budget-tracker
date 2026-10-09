from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.savings import GoalCreate, GoalRead, LogCreate, LogRead
from app.services import savings_service

router = APIRouter(prefix="/savings", tags=["savings"])


@router.post("/goals", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_service.create_goal(db, current_user.id, data)
    return savings_service.goal_view(db, goal)


@router.get("/goals", response_model=list[GoalRead])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = savings_service.list_goals(db, current_user.id)
    return [savings_service.goal_view(db, goal) for goal in goals]


@router.get("/goals/{goal_id}", response_model=GoalRead)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_service.get_goal(db, current_user.id, goal_id)
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    return savings_service.goal_view(db, goal)


@router.post(
    "/goals/{goal_id}/logs",
    response_model=LogRead,
    status_code=status.HTTP_201_CREATED,
)
def add_log(
    goal_id: int,
    data: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_service.get_goal(db, current_user.id, goal_id)
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    return savings_service.add_log(db, goal, data)