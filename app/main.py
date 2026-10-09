from fastapi import FastAPI

from app.routers import auth

app = FastAPI(title="Budget Tracker")
app.include_router(auth.router)