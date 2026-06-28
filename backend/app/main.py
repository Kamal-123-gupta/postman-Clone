from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.db.seed import seed_db
from app.api.v1.collections import router as collections_router
from app.api.v1.environments import router as environments_router
from app.api.v1.history import router as history_router
from app.api.v1.tabs import router as tabs_router
from app.api.v1.runner import router as runner_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables automatically on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed database with sample collections, environments, and history
    async with SessionLocal() as db:
        await seed_db(db)
    yield

app = FastAPI(title="Postman Clone API", lifespan=lifespan)

# CORS configuration to allow local frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(collections_router, prefix="/api/v1/collections", tags=["Collections"])
app.include_router(environments_router, prefix="/api/v1/environments", tags=["Environments"])
app.include_router(history_router, prefix="/api/v1/history", tags=["History"])
app.include_router(tabs_router, prefix="/api/v1/tabs", tags=["Tabs"])
app.include_router(runner_router, prefix="/api/v1/runner", tags=["Runner"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}
