from typing import Generic, Type, TypeVar, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        # Implementation in specific repositories or generic if no special translation is needed
        pass
