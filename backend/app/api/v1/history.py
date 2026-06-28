from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_history_repo
from app.repositories.history import HistoryRepository
from app.repositories.mappers import map_history_db_to_schema
from app.schemas.history import History

router = APIRouter()

@router.get("", response_model=List[History])
async def read_history(
    limit: int = 100,
    repo: HistoryRepository = Depends(get_history_repo)
):
    db_hist = await repo.get_all(limit=limit)
    return [map_history_db_to_schema(h) for h in db_hist]

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    id: int,
    repo: HistoryRepository = Depends(get_history_repo)
):
    deleted = await repo.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History item not found")
    return None

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_history(
    repo: HistoryRepository = Depends(get_history_repo)
):
    await repo.clear_all()
    return None
