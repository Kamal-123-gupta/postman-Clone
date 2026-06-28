from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.repositories.collection import CollectionRepository
from app.repositories.request import RequestRepository
from app.repositories.environment import EnvironmentRepository
from app.repositories.history import HistoryRepository
from app.repositories.tab import TabRepository

async def get_collection_repo(db: AsyncSession = Depends(get_db)) -> CollectionRepository:
    return CollectionRepository(db)

async def get_request_repo(db: AsyncSession = Depends(get_db)) -> RequestRepository:
    return RequestRepository(db)

async def get_env_repo(db: AsyncSession = Depends(get_db)) -> EnvironmentRepository:
    return EnvironmentRepository(db)

async def get_history_repo(db: AsyncSession = Depends(get_db)) -> HistoryRepository:
    return HistoryRepository(db)

async def get_tab_repo(db: AsyncSession = Depends(get_db)) -> TabRepository:
    return TabRepository(db)
