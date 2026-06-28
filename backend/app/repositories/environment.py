from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.models import Environment, Variable
from app.schemas.environment import EnvironmentCreate, VariableCreate

class EnvironmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: int) -> Optional[Environment]:
        result = await self.db.execute(
            select(Environment)
            .filter(Environment.id == id)
            .options(selectinload(Environment.variables))
        )
        return result.scalars().first()

    async def get_all(self) -> List[Environment]:
        result = await self.db.execute(
            select(Environment)
            .options(selectinload(Environment.variables))
        )
        return list(result.scalars().all())

    async def get_globals(self) -> List[Variable]:
        result = await self.db.execute(
            select(Variable).filter(Variable.environment_id == None)
        )
        return list(result.scalars().all())

    async def create(self, obj_in: EnvironmentCreate) -> Environment:
        db_obj = Environment(name=obj_in.name)
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

    async def create_variable(self, obj_in: VariableCreate) -> Variable:
        # Check if variable with same key already exists in this environment
        existing = await self.db.execute(
            select(Variable).filter(
                Variable.environment_id == obj_in.environment_id,
                Variable.key == obj_in.key
            )
        )
        db_var = existing.scalars().first()
        if db_var:
            db_var.value = obj_in.value
        else:
            db_var = Variable(
                environment_id=obj_in.environment_id,
                key=obj_in.key,
                value=obj_in.value
            )
            self.db.add(db_var)
        await self.db.commit()
        await self.db.refresh(db_var)
        return db_var

    async def update_variable(self, var_id: int, key: str, value: str) -> Optional[Variable]:
        result = await self.db.execute(select(Variable).filter(Variable.id == var_id))
        db_var = result.scalars().first()
        if db_var:
            db_var.key = key
            db_var.value = value
            self.db.add(db_var)
            await self.db.commit()
            await self.db.refresh(db_var)
            return db_var
        return None

    async def delete_variable(self, var_id: int) -> bool:
        result = await self.db.execute(select(Variable).filter(Variable.id == var_id))
        db_var = result.scalars().first()
        if db_var:
            await self.db.delete(db_var)
            await self.db.commit()
            return True
        return False
