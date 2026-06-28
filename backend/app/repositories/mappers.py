import json
from typing import List, Dict, Any, Optional
from app.db.models import Collection as DBCollection, Request as DBRequest, History as DBHistory, Environment as DBEnvironment, Variable as DBVariable, Tab as DBTab
from app.schemas.request import Request as SchemaRequest, KeyValueItem
from app.schemas.collection import Collection as SchemaCollection
from app.schemas.history import History as SchemaHistory
from app.schemas.environment import Environment as SchemaEnvironment, Variable as SchemaVariable
from app.schemas.tab import Tab as SchemaTab

def safe_json_loads(val: Optional[str], default: Any = None) -> Any:
    if not val:
        return default if default is not None else []
    try:
        return json.loads(val)
    except Exception:
        return default if default is not None else []

def map_key_value_items(items: List[Any]) -> List[KeyValueItem]:
    return [
        KeyValueItem(
            key=item.get("key", ""),
            value=item.get("value", ""),
            enabled=item.get("enabled", True),
            description=item.get("description", None)
        ) for item in items
    ]

def map_request_db_to_schema(db_req: DBRequest) -> SchemaRequest:
    headers_raw = safe_json_loads(db_req.headers, [])
    params_raw = safe_json_loads(db_req.query_params, [])
    auth_raw = safe_json_loads(db_req.auth_config, {})

    return SchemaRequest(
        id=db_req.id,
        collection_id=db_req.collection_id,
        name=db_req.name,
        method=db_req.method,
        url=db_req.url,
        headers=map_key_value_items(headers_raw),
        query_params=map_key_value_items(params_raw),
        body_type=db_req.body_type,
        body_content=db_req.body_content,
        auth_type=db_req.auth_type,
        auth_config=auth_raw,
        created_at=db_req.created_at,
        updated_at=db_req.updated_at
    )

def map_collection_db_to_schema(db_col: DBCollection, all_collections: List[DBCollection] = None) -> SchemaCollection:
    requests = [map_request_db_to_schema(req) for req in db_col.requests]
    
    # If all_collections is provided, find children and map recursively
    children_schemas = []
    if all_collections:
        children_db = [c for c in all_collections if c.parent_id == db_col.id]
        children_schemas = [map_collection_db_to_schema(child, all_collections) for child in children_db]

    return SchemaCollection(
        id=db_col.id,
        name=db_col.name,
        description=db_col.description,
        parent_id=db_col.parent_id,
        created_at=db_col.created_at,
        updated_at=db_col.updated_at,
        requests=requests,
        children=children_schemas
    )

def map_history_db_to_schema(db_hist: DBHistory) -> SchemaHistory:
    headers_raw = safe_json_loads(db_hist.headers, [])
    params_raw = safe_json_loads(db_hist.query_params, [])
    auth_raw = safe_json_loads(db_hist.auth_config, {})
    resp_headers_raw = safe_json_loads(db_hist.response_headers, [])

    return SchemaHistory(
        id=db_hist.id,
        name=db_hist.name,
        method=db_hist.method,
        url=db_hist.url,
        headers=map_key_value_items(headers_raw),
        query_params=map_key_value_items(params_raw),
        body_type=db_hist.body_type,
        body_content=db_hist.body_content,
        auth_type=db_hist.auth_type,
        auth_config=auth_raw,
        response_status=db_hist.response_status,
        response_time_ms=db_hist.response_time_ms,
        response_size_bytes=db_hist.response_size_bytes,
        response_headers=map_key_value_items(resp_headers_raw),
        response_body=db_hist.response_body,
        sent_at=db_hist.sent_at
    )

def map_variable_db_to_schema(db_var: DBVariable) -> SchemaVariable:
    return SchemaVariable(
        id=db_var.id,
        environment_id=db_var.environment_id,
        key=db_var.key,
        value=db_var.value,
        created_at=db_var.created_at,
        updated_at=db_var.updated_at
    )

def map_environment_db_to_schema(db_env: DBEnvironment) -> SchemaEnvironment:
    variables = [map_variable_db_to_schema(var) for var in db_env.variables]
    return SchemaEnvironment(
        id=db_env.id,
        name=db_env.name,
        created_at=db_env.created_at,
        updated_at=db_env.updated_at,
        variables=variables
    )

def map_tab_db_to_schema(db_tab: DBTab) -> SchemaTab:
    headers_raw = safe_json_loads(db_tab.headers, [])
    params_raw = safe_json_loads(db_tab.query_params, [])
    auth_raw = safe_json_loads(db_tab.auth_config, {})

    return SchemaTab(
        id=db_tab.id,
        request_id=db_tab.request_id,
        name=db_tab.name,
        method=db_tab.method,
        url=db_tab.url,
        headers=map_key_value_items(headers_raw),
        query_params=map_key_value_items(params_raw),
        body_type=db_tab.body_type,
        body_content=db_tab.body_content,
        auth_type=db_tab.auth_type,
        auth_config=auth_raw,
        is_dirty=db_tab.is_dirty,
        position=db_tab.position,
        is_active=db_tab.is_active,
        updated_at=db_tab.updated_at
    )
