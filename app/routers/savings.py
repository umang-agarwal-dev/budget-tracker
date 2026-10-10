from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.savings import AdviceRead, GoalCreate, GoalRead, LogCreate, LogRead
from app.services import ai_service, savings_service,ai_usage_service
from app.core.config import settings


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


@router.get("/goals/{goal_id}/advice", response_model=AdviceRead)
def goal_advice(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_service.get_goal(db, current_user.id, goal_id)
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")

    if ai_usage_service.remaining_today(db, current_user.id) == 0:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Daily limit reached ({settings.AI_DAILY_LIMIT} per day). Try again tomorrow.",
        )

    facts = savings_service.build_advice_facts(db, current_user.id, goal)
    if facts is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Set a monthly budget first"
        )

    try:
        advice = ai_service.savings_advice(facts)
        ai_usage_service.record_usage(db, current_user.id, goal.id, advice)
        source = "ai"
    except ai_service.AIUnavailableError:
        advice = ai_service.fallback_advice(facts)
        source = "basic"

    return {
        "advice": advice,
        "remaining_today": ai_usage_service.remaining_today(db, current_user.id),
        "source": source,
    }