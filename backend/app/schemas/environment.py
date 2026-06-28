from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VariableBase(BaseModel):
    key: str
    value: str
    environment_id: Optional[int] = None

class VariableCreate(VariableBase):
    pass

class VariableUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None

class VariableInDBBase(VariableBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Variable(VariableInDBBase):
    pass

class EnvironmentBase(BaseModel):
    name: str

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None

class EnvironmentInDBBase(EnvironmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Environment(EnvironmentInDBBase):
    variables: List[Variable] = []
