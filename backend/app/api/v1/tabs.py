from fastapi import APIRouter, Depends, status
from typing import List
from app.api.deps import get_tab_repo
from app.repositories.tab import TabRepository
from app.repositories.mappers import map_tab_db_to_schema
from app.schemas.tab import Tab, TabCreate

router = APIRouter()

@router.get("", response_model=List[Tab])
async def read_tabs(repo: TabRepository = Depends(get_tab_repo)):
    db_tabs = await repo.get_all()
    return [map_tab_db_to_schema(t) for t in db_tabs]

@router.put("/sync", response_model=List[Tab])
async def sync_tabs(
    tabs_in: List[TabCreate],
    repo: TabRepository = Depends(get_tab_repo)
):
    db_tabs = await repo.sync_all(tabs_in)
    return [map_tab_db_to_schema(t) for t in db_tabs]
