from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.request import KeyValueItem

class SendRequest(BaseModel):
    name: Optional[str] = None
    url: str
    method: str = "GET"
    headers: List[KeyValueItem] = Field(default_factory=list)
    query_params: List[KeyValueItem] = Field(default_factory=list)
    body_type: str = "none"
    body_content: Optional[str] = None
    auth_type: str = "none"
    auth_config: Optional[Dict[str, Any]] = None
    environment_id: Optional[int] = None

class SendResponse(BaseModel):
    status: int
    status_text: str
    time_ms: int
    size_bytes: int
    headers: List[KeyValueItem]
    body: str
    error: Optional[str] = None
