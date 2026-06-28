import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Tab
from app.schemas.tab import TabCreate, TabUpdate

class TabRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: int) -> Optional[Tab]:
        result = await self.db.execute(select(Tab).filter(Tab.id == id))
        return result.scalars().first()

    async def get_all(self) -> List[Tab]:
        result = await self.db.execute(select(Tab).order_by(Tab.position.asc()))
        return list(result.scalars().all())

    async def create(self, obj_in: TabCreate) -> Tab:
        headers_str = json.dumps([h.model_dump() for h in obj_in.headers])
        params_str = json.dumps([p.model_dump() for p in obj_in.query_params])
        auth_str = json.dumps(obj_in.auth_config) if obj_in.auth_config is not None else None

        db_obj = Tab(
            request_id=obj_in.request_id,
            name=obj_in.name,
            method=obj_in.method,
            url=obj_in.url,
            headers=headers_str,
            query_params=params_str,
            body_type=obj_in.body_type,
            body_content=obj_in.body_content,
            auth_type=obj_in.auth_type,
            auth_config=auth_str,
            is_dirty=obj_in.is_dirty,
            position=obj_in.position,
            is_active=obj_in.is_active
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Tab, obj_in: TabUpdate) -> Tab:
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

    async def sync_all(self, tabs_in: List[TabCreate]) -> List[Tab]:
        # Delete existing tabs
        result = await self.db.execute(select(Tab))
        existing_tabs = result.scalars().all()
        for tab in existing_tabs:
            await self.db.delete(tab)
        await self.db.commit()

        # Insert new tabs
        db_tabs = []
        for obj_in in tabs_in:
            headers_str = json.dumps([h.model_dump() for h in obj_in.headers])
            params_str = json.dumps([p.model_dump() for p in obj_in.query_params])
            auth_str = json.dumps(obj_in.auth_config) if obj_in.auth_config is not None else None

            db_tab = Tab(
                request_id=obj_in.request_id,
                name=obj_in.name,
                method=obj_in.method,
                url=obj_in.url,
                headers=headers_str,
                query_params=params_str,
                body_type=obj_in.body_type,
                body_content=obj_in.body_content,
                auth_type=obj_in.auth_type,
                auth_config=auth_str,
                is_dirty=obj_in.is_dirty,
                position=obj_in.position,
                is_active=obj_in.is_active
            )
            self.db.add(db_tab)
            db_tabs.append(db_tab)
        
        await self.db.commit()
        for db_tab in db_tabs:
            await self.db.refresh(db_tab)
        return db_tabs
