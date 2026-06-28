import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"
    
    def __init__(self, **values):
        super().__init__(**values)
        if os.getenv("VERCEL") and self.DATABASE_URL == "sqlite+aiosqlite:///./dev.db":
            self.DATABASE_URL = "sqlite+aiosqlite:////tmp/dev.db"
    
    class Config:
        case_sensitive = True

settings = Settings()
