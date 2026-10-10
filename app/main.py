from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import auth, budget, dashboard, expenses, groups, savings

app = FastAPI(title="Budget Tracker")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(budget.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(savings.router)
app.include_router(groups.router)


@app.get("/health")
def health():
    return {"status": "ok"}