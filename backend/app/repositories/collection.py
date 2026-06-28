from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.models import Collection
from app.schemas.collection import CollectionCreate, CollectionUpdate
from app.repositories.mappers import map_collection_db_to_schema
from app.schemas.collection import Collection as SchemaCollection

class CollectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: int) -> Optional[Collection]:
        result = await self.db.execute(
            select(Collection)
            .filter(Collection.id == id)
            .options(selectinload(Collection.requests))
        )
        return result.scalars().first()

    async def get_tree(self) -> List[SchemaCollection]:
        result = await self.db.execute(
            select(Collection)
            .options(selectinload(Collection.requests))
        )
        all_cols = list(result.scalars().all())
        
        # Root collections have parent_id as None
        root_cols = [c for c in all_cols if c.parent_id is None]
        return [map_collection_db_to_schema(c, all_cols) for c in root_cols]

    async def create(self, obj_in: CollectionCreate) -> Collection:
        db_obj = Collection(
            name=obj_in.name,
            description=obj_in.description,
            parent_id=obj_in.parent_id
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Collection, obj_in: CollectionUpdate) -> Collection:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: int) -> bool:
        db_obj = await self.get(id)
        if db_obj:
            await self.db.delete(db_obj)
            await self.db.commit()
            return True
        return False
