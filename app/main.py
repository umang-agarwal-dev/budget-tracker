from fastapi import FastAPI

from app.routers import auth, budget, dashboard, expenses

app = FastAPI(title="Budget Tracker")
app.include_router(auth.router)
app.include_router(budget.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)