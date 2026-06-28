import time
import httpx
import base64
import json
from typing import List, Dict, Any, Optional
from app.schemas.request import KeyValueItem

class RequestRunner:
    @staticmethod
    async def send_request(
        url: str,
        method: str,
        headers: List[KeyValueItem],
        query_params: List[KeyValueItem],
        body_type: str,
        body_content: Optional[str],
        auth_type: str,
        auth_config: Optional[Dict[str, Any]],
        timeout_seconds: float = 30.0
    ) -> Dict[str, Any]:
        
        # 1. Prepare Request Headers
        req_headers = {}
        for h in headers:
            if h.enabled and h.key:
                req_headers[h.key] = h.value

        # 2. Prepare Query Parameters
        req_params = {}
        for p in query_params:
            if p.enabled and p.key:
                req_params[p.key] = p.value

        # 3. Add Authentication Headers
        if auth_type == "bearer" and auth_config:
            token = auth_config.get("token", "")
            if token:
                req_headers["Authorization"] = f"Bearer {token}"
        elif auth_type == "basic" and auth_config:
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            encoded = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("utf-8")
            req_headers["Authorization"] = f"Basic {encoded}"

        # 4. Prepare Body
        req_data = None
        req_files = None
        req_content = None

        if body_type == "raw" and body_content:
            req_content = body_content
            # Set application/json content type if headers don't have it and it looks like JSON
            if "Content-Type" not in req_headers:
                try:
                    json.loads(body_content)
                    req_headers["Content-Type"] = "application/json"
                except Exception:
                    req_headers["Content-Type"] = "text/plain"

        elif body_type == "x-www-form-urlencoded" and body_content:
            try:
                items = json.loads(body_content)
                if isinstance(items, list):
                    req_data = {
                        item["key"]: item["value"] 
                        for item in items 
                        if item.get("enabled", True) and item.get("key")
                    }
                else:
                    req_content = body_content
            except Exception:
                # Fallback to plain text
                req_content = body_content
                if "Content-Type" not in req_headers:
                    req_headers["Content-Type"] = "application/x-www-form-urlencoded"

        elif body_type == "form-data" and body_content:
            try:
                items = json.loads(body_content)
                if isinstance(items, list):
                    req_data = {}
                    for item in items:
                        if item.get("enabled", True) and item.get("key"):
                            req_data[item["key"]] = item["value"]
            except Exception:
                req_content = body_content

        # 5. Execute HTTP Request
        # Disable SSL verification (verify=False) to support testing local self-signed endpoints
        async with httpx.AsyncClient(verify=False) as client:
            start_time = time.perf_counter()
            try:
                # Build request object
                request = client.build_request(
                    method=method.upper(),
                    url=url,
                    headers=req_headers,
                    params=req_params,
                    data=req_data,
                    files=req_files,
                    content=req_content,
                    timeout=timeout_seconds
                )
                
                # Send request
                response = await client.send(request)
                end_time = time.perf_counter()
                
                # Metrics
                time_ms = int((end_time - start_time) * 1000)
                size_bytes = len(response.content)
                
                # Format Response Headers
                resp_headers = [
                    KeyValueItem(key=k, value=v, enabled=True) 
                    for k, v in response.headers.items()
                ]
                
                # Body decoding
                try:
                    resp_body = response.text
                except Exception:
                    resp_body = response.content.decode("utf-8", errors="replace")

                return {
                    "status": response.status_code,
                    "status_text": response.reason_phrase,
                    "time_ms": time_ms,
                    "size_bytes": size_bytes,
                    "headers": resp_headers,
                    "body": resp_body,
                    "error": None
                }

            except httpx.TimeoutException as e:
                end_time = time.perf_counter()
                return {
                    "status": 0,
                    "status_text": "Gateway Timeout",
                    "time_ms": int((end_time - start_time) * 1000),
                    "size_bytes": 0,
                    "headers": [],
                    "body": "",
                    "error": f"Request timed out after {timeout_seconds}s. {str(e)}"
                }
            except httpx.ConnectError as e:
                end_time = time.perf_counter()
                return {
                    "status": 0,
                    "status_text": "Connection Error",
                    "time_ms": int((end_time - start_time) * 1000),
                    "size_bytes": 0,
                    "headers": [],
                    "body": "",
                    "error": f"Failed to establish connection to target server: {str(e)}"
                }
            except httpx.InvalidURL as e:
                return {
                    "status": 0,
                    "status_text": "Invalid URL",
                    "time_ms": 0,
                    "size_bytes": 0,
                    "headers": [],
                    "body": "",
                    "error": f"The URL is malformed or invalid: {str(e)}"
                }
            except Exception as e:
                end_time = time.perf_counter()
                return {
                    "status": 0,
                    "status_text": "Error",
                    "time_ms": int((end_time - start_time) * 1000) if 'start_time' in locals() else 0,
                    "size_bytes": 0,
                    "headers": [],
                    "body": "",
                    "error": f"An unexpected network or client error occurred: {str(e)}"
                }
