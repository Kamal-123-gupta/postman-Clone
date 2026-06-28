import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import History
from app.schemas.history import HistoryCreate

class HistoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: int) -> Optional[History]:
        result = await self.db.execute(select(History).filter(History.id == id))
        return result.scalars().first()

    async def get_all(self, limit: int = 100) -> List[History]:
        result = await self.db.execute(
            select(History).order_by(History.sent_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj_in: HistoryCreate) -> History:
        headers_str = json.dumps([h.model_dump() for h in obj_in.headers])
        params_str = json.dumps([p.model_dump() for p in obj_in.query_params])
        auth_str = json.dumps(obj_in.auth_config) if obj_in.auth_config is not None else None
        resp_headers_str = json.dumps([h.model_dump() for h in obj_in.response_headers]) if obj_in.response_headers is not None else None

        db_obj = History(
            name=obj_in.name,
            method=obj_in.method,
            url=obj_in.url,
            headers=headers_str,
            query_params=params_str,
            body_type=obj_in.body_type,
            body_content=obj_in.body_content,
            auth_type=obj_in.auth_type,
            auth_config=auth_str,
            response_status=obj_in.response_status,
            response_time_ms=obj_in.response_time_ms,
            response_size_bytes=obj_in.response_size_bytes,
            response_headers=resp_headers_str,
            response_body=obj_in.response_body
        )
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

    async def clear_all(self) -> bool:
        result = await self.db.execute(select(History))
        items = result.scalars().all()
        for item in items:
            await self.db.delete(item)
        await self.db.commit()
        return True
