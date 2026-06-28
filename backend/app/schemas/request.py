from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class KeyValueItem(BaseModel):
    key: str
    value: str
    enabled: bool = True
    description: Optional[str] = None

class RequestBase(BaseModel):
    name: str
    method: str = "GET"
    url: str = ""
    headers: List[KeyValueItem] = Field(default_factory=list)
    query_params: List[KeyValueItem] = Field(default_factory=list)
    body_type: str = "none" # none, raw, form-data, x-www-form-urlencoded
    body_content: Optional[str] = None
    auth_type: str = "none" # none, basic, bearer
    auth_config: Optional[Dict[str, Any]] = None

class RequestCreate(RequestBase):
    collection_id: Optional[int] = None

class RequestUpdate(BaseModel):
    collection_id: Optional[int] = None
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[KeyValueItem]] = None
    query_params: Optional[List[KeyValueItem]] = None
    body_type: Optional[str] = None
    body_content: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[Dict[str, Any]] = None

class RequestInDBBase(RequestBase):
    id: int
    collection_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Request(RequestInDBBase):
    pass
