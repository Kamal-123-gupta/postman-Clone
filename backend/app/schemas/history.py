from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.request import KeyValueItem

class HistoryBase(BaseModel):
    name: Optional[str] = None
    method: str
    url: str
    headers: List[KeyValueItem] = Field(default_factory=list)
    query_params: List[KeyValueItem] = Field(default_factory=list)
    body_type: str = "none"
    body_content: Optional[str] = None
    auth_type: str = "none"
    auth_config: Optional[Dict[str, Any]] = None
    
    response_status: int
    response_time_ms: int
    response_size_bytes: int
    response_headers: Optional[List[KeyValueItem]] = Field(default_factory=list)
    response_body: Optional[str] = None

class HistoryCreate(HistoryBase):
    pass

class HistoryInDBBase(HistoryBase):
    id: int
    sent_at: datetime

    class Config:
        from_attributes = True

class History(HistoryInDBBase):
    pass
