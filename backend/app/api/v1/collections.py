from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_collection_repo, get_request_repo
from app.repositories.collection import CollectionRepository
from app.repositories.request import RequestRepository
from app.repositories.mappers import map_collection_db_to_schema, map_request_db_to_schema
from app.schemas.collection import Collection, CollectionCreate, CollectionUpdate
from app.schemas.request import Request, RequestCreate, RequestUpdate

router = APIRouter()

@router.get("", response_model=List[Collection])
async def read_collections(repo: CollectionRepository = Depends(get_collection_repo)):
    return await repo.get_tree()

@router.post("", response_model=Collection, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_in: CollectionCreate,
    repo: CollectionRepository = Depends(get_collection_repo)
):
    db_col = await repo.create(collection_in)
    full_col = await repo.get(db_col.id)
    return map_collection_db_to_schema(full_col)

@router.put("/{id}", response_model=Collection)
async def update_collection(
    id: int,
    collection_in: CollectionUpdate,
    repo: CollectionRepository = Depends(get_collection_repo)
):
    db_col = await repo.get(id)
    if not db_col:
        raise HTTPException(status_code=404, detail="Collection not found")
    db_col = await repo.update(db_col, collection_in)
    return map_collection_db_to_schema(db_col)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    id: int,
    repo: CollectionRepository = Depends(get_collection_repo)
):
    deleted = await repo.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Collection not found")
    return None

@router.post("/requests", response_model=Request, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_in: RequestCreate,
    request_repo: RequestRepository = Depends(get_request_repo),
    col_repo: CollectionRepository = Depends(get_collection_repo)
):
    if request_in.collection_id:
        db_col = await col_repo.get(request_in.collection_id)
        if not db_col:
            raise HTTPException(status_code=404, detail="Parent collection not found")
    
    db_req = await request_repo.create(request_in)
    return map_request_db_to_schema(db_req)

@router.put("/requests/{request_id}", response_model=Request)
async def update_request(
    request_id: int,
    request_in: RequestUpdate,
    request_repo: RequestRepository = Depends(get_request_repo)
):
    db_req = await request_repo.get(request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")
    db_req = await request_repo.update(db_req, request_in)
    return map_request_db_to_schema(db_req)

@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: int,
    request_repo: RequestRepository = Depends(get_request_repo)
):
    deleted = await request_repo.delete(request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Request not found")
    return None
