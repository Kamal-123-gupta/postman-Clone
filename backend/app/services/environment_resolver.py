import re
import json
from typing import Dict, List, Optional, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Variable
from app.schemas.request import KeyValueItem

class EnvironmentResolver:
    @staticmethod
    def resolve_string(value: str, variables: Dict[str, str], max_depth: int = 5, current_depth: int = 0) -> str:
        if not value or current_depth >= max_depth:
            return value
        
        # Matches {{variable_name}}
        pattern = re.compile(r"\{\{([a-zA-Z0-9_\-\.]+)\}\}")
        matches = pattern.findall(value)
        if not matches:
            return value
            
        resolved_val = value
        for match in matches:
            if match in variables:
                # Recursively resolve the variable content first
                replaced_with = EnvironmentResolver.resolve_string(
                    variables[match], variables, max_depth, current_depth + 1
                )
                resolved_val = resolved_val.replace(f"{{{{{match}}}}}", replaced_with)
                
        return resolved_val

    @staticmethod
    async def get_variables_map(db: AsyncSession, environment_id: Optional[int] = None) -> Dict[str, str]:
        # 1. Fetch Global variables (environment_id is NULL)
        global_result = await db.execute(
            select(Variable).filter(Variable.environment_id == None)
        )
        globals_list = global_result.scalars().all()
        
        variables_map = {v.key: v.value for v in globals_list}
        
        # 2. Fetch Environment variables (if environment_id is provided)
        if environment_id:
            env_result = await db.execute(
                select(Variable).filter(Variable.environment_id == environment_id)
            )
            env_list = env_result.scalars().all()
            for v in env_list:
                variables_map[v.key] = v.value
                
        return variables_map

    @classmethod
    async def resolve_request(
        cls,
        db: AsyncSession,
        url: str,
        headers: List[KeyValueItem],
        query_params: List[KeyValueItem],
        body_type: str,
        body_content: Optional[str],
        auth_type: str,
        auth_config: Optional[Dict[str, Any]],
        environment_id: Optional[int] = None
    ) -> tuple[str, List[KeyValueItem], List[KeyValueItem], Optional[str], Optional[Dict[str, Any]]]:
        
        variables = await cls.get_variables_map(db, environment_id)
        
        # Resolve URL
        resolved_url = cls.resolve_string(url, variables)
        
        # Resolve Headers (only if enabled)
        resolved_headers = []
        for h in headers:
            if h.enabled:
                resolved_headers.append(KeyValueItem(
                    key=cls.resolve_string(h.key, variables),
                    value=cls.resolve_string(h.value, variables),
                    enabled=True,
                    description=h.description
                ))
            else:
                resolved_headers.append(h)
                
        # Resolve Query Params (only if enabled)
        resolved_query_params = []
        for p in query_params:
            if p.enabled:
                resolved_query_params.append(KeyValueItem(
                    key=cls.resolve_string(p.key, variables),
                    value=cls.resolve_string(p.value, variables),
                    enabled=True,
                    description=p.description
                ))
            else:
                resolved_query_params.append(p)
                
        # Resolve Body Content
        resolved_body_content = body_content
        if body_content and body_type in ["raw", "x-www-form-urlencoded"]:
            resolved_body_content = cls.resolve_string(body_content, variables)
        elif body_content and body_type == "form-data":
            # Form data content is usually saved as a JSON string of KeyValueItems
            try:
                items = json.loads(body_content)
                if isinstance(items, list):
                    resolved_items = []
                    for item in items:
                        if item.get("enabled", True):
                            resolved_items.append({
                                "key": cls.resolve_string(item.get("key", ""), variables),
                                "value": cls.resolve_string(item.get("value", ""), variables),
                                "type": item.get("type", "text"),
                                "enabled": True,
                                "description": item.get("description", None)
                            })
                        else:
                            resolved_items.append(item)
                    resolved_body_content = json.dumps(resolved_items)
            except Exception:
                # Fallback to string replacement
                resolved_body_content = cls.resolve_string(body_content, variables)
                
        # Resolve Auth Config
        resolved_auth_config = None
        if auth_config:
            resolved_auth_config = {}
            for k, v in auth_config.items():
                if isinstance(v, str):
                    resolved_auth_config[k] = cls.resolve_string(v, variables)
                else:
                    resolved_auth_config[k] = v
                    
        return resolved_url, resolved_headers, resolved_query_params, resolved_body_content, resolved_auth_config
