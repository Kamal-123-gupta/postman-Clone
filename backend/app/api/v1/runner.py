from fastapi import APIRouter, Depends, status
from app.api.deps import get_history_repo, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.history import HistoryRepository
from app.schemas.runner import SendRequest, SendResponse
from app.schemas.history import HistoryCreate
from app.services.environment_resolver import EnvironmentResolver
from app.services.request_runner import RequestRunner

router = APIRouter()

@router.post("/send", response_model=SendResponse)
async def send_http_request(
    payload: SendRequest,
    db: AsyncSession = Depends(get_db),
    history_repo: HistoryRepository = Depends(get_history_repo)
):
    # 1. Resolve variables
    resolved_url, resolved_headers, resolved_query_params, resolved_body_content, resolved_auth_config = \
        await EnvironmentResolver.resolve_request(
            db=db,
            url=payload.url,
            headers=payload.headers,
            query_params=payload.query_params,
            body_type=payload.body_type,
            body_content=payload.body_content,
            auth_type=payload.auth_type,
            auth_config=payload.auth_config,
            environment_id=payload.environment_id
        )

    # 2. Run request
    response_data = await RequestRunner.send_request(
        url=resolved_url,
        method=payload.method,
        headers=resolved_headers,
        query_params=resolved_query_params,
        body_type=payload.body_type,
        body_content=resolved_body_content,
        auth_type=payload.auth_type,
        auth_config=resolved_auth_config
    )

    # 3. Save to History (store unresolved request to maintain variable template tags)
    history_in = HistoryCreate(
        name=payload.name,
        method=payload.method,
        url=payload.url,
        headers=payload.headers,
        query_params=payload.query_params,
        body_type=payload.body_type,
        body_content=payload.body_content,
        auth_type=payload.auth_type,
        auth_config=payload.auth_config,
        response_status=response_data["status"],
        response_time_ms=response_data["time_ms"],
        response_size_bytes=response_data["size_bytes"],
        response_headers=response_data["headers"],
        response_body=response_data["body"]
    )
    await history_repo.create(history_in)

    return response_data
