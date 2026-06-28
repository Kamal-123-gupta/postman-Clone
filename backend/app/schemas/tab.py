from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.request import KeyValueItem

class TabBase(BaseModel):
    request_id: Optional[int] = None
    name: str
    method: str = "GET"
    url: str = ""
    headers: List[KeyValueItem] = Field(default_factory=list)
    query_params: List[KeyValueItem] = Field(default_factory=list)
    body_type: str = "none"
    body_content: Optional[str] = None
    auth_type: str = "none"
    auth_config: Optional[Dict[str, Any]] = None
    is_dirty: bool = False
    position: int = 0
    is_active: bool = False

class TabCreate(TabBase):
    pass

class TabUpdate(BaseModel):
    request_id: Optional[int] = None
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[KeyValueItem]] = None
    query_params: Optional[List[KeyValueItem]] = None
    body_type: Optional[str] = None
    body_content: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[Dict[str, Any]] = None
    is_dirty: Optional[bool] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None

class TabInDBBase(TabBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class Tab(TabInDBBase):
    pass
