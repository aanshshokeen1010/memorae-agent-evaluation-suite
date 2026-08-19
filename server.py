from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import API_TITLE, API_VERSION
from app.api.routes import router

app = FastAPI(
    title=API_TITLE,
    description="Backend API for evaluating AI agent executions.",
    version=API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)