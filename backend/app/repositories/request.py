import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Request
from app.schemas.request import RequestCreate, RequestUpdate

class RequestRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: int) -> Optional[Request]:
        result = await self.db.execute(select(Request).filter(Request.id == id))
        return result.scalars().first()

    async def get_multi_by_collection(self, collection_id: int) -> List[Request]:
        result = await self.db.execute(select(Request).filter(Request.collection_id == collection_id))
        return list(result.scalars().all())

    async def create(self, obj_in: RequestCreate) -> Request:
        headers_str = json.dumps([h.model_dump() for h in obj_in.headers])
        params_str = json.dumps([p.model_dump() for p in obj_in.query_params])
        auth_str = json.dumps(obj_in.auth_config) if obj_in.auth_config is not None else None

        db_obj = Request(
            collection_id=obj_in.collection_id,
            name=obj_in.name,
            method=obj_in.method,
            url=obj_in.url,
            headers=headers_str,
            query_params=params_str,
            body_type=obj_in.body_type,
            body_content=obj_in.body_content,
            auth_type=obj_in.auth_type,
            auth_config=auth_str
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Request, obj_in: RequestUpdate) -> Request:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "headers":
                setattr(db_obj, "headers", json.dumps([h.model_dump() for h in value]))
            elif field == "query_params":
                setattr(db_obj, "query_params", json.dumps([p.model_dump() for p in value]))
            elif field == "auth_config":
                setattr(db_obj, "auth_config", json.dumps(value) if value is not None else None)
            else:
                setattr(db_obj, field, value)
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
