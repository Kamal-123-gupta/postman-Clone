from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.request import Request

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None

class CollectionInDBBase(CollectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Collection(CollectionInDBBase):
    requests: List[Request] = []
    children: List["Collection"] = []

Collection.model_rebuild()
