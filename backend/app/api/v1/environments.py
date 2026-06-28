from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_env_repo
from app.repositories.environment import EnvironmentRepository
from app.repositories.mappers import map_environment_db_to_schema, map_variable_db_to_schema
from app.schemas.environment import Environment, EnvironmentCreate, Variable, VariableCreate

router = APIRouter()

@router.get("", response_model=List[Environment])
async def read_environments(repo: EnvironmentRepository = Depends(get_env_repo)):
    db_envs = await repo.get_all()
    return [map_environment_db_to_schema(env) for env in db_envs]

@router.post("", response_model=Environment, status_code=status.HTTP_201_CREATED)
async def create_environment(
    env_in: EnvironmentCreate,
    repo: EnvironmentRepository = Depends(get_env_repo)
):
    db_env = await repo.create(env_in)
    full_env = await repo.get(db_env.id)
    return map_environment_db_to_schema(full_env)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_environment(
    id: int,
    repo: EnvironmentRepository = Depends(get_env_repo)
):
    deleted = await repo.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Environment not found")
    return None

@router.get("/globals", response_model=List[Variable])
async def read_globals(repo: EnvironmentRepository = Depends(get_env_repo)):
    db_vars = await repo.get_globals()
    return [map_variable_db_to_schema(var) for var in db_vars]

@router.post("/variables", response_model=Variable)
async def create_variable(
    var_in: VariableCreate,
    repo: EnvironmentRepository = Depends(get_env_repo)
):
    if var_in.environment_id:
        db_env = await repo.get(var_in.environment_id)
        if not db_env:
            raise HTTPException(status_code=404, detail="Environment not found")
            
    db_var = await repo.create_variable(var_in)
    return map_variable_db_to_schema(db_var)

@router.delete("/variables/{var_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variable(
    var_id: int,
    repo: EnvironmentRepository = Depends(get_env_repo)
):
    deleted = await repo.delete_variable(var_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Variable not found")
    return None
