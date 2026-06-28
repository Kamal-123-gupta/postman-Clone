import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Collection, Request, Environment, Variable, History

async def seed_db(db: AsyncSession):
    # Check if collections already exist to prevent duplicate seeding
    result = await db.execute(select(Collection))
    if result.scalars().first():
        return # Database already seeded
    
    # 1. Create Environments
    dev_env = Environment(name="Development")
    prod_env = Environment(name="Production")
    db.add(dev_env)
    db.add(prod_env)
    await db.flush() # Populate IDs

    # 2. Create variables inside environments
    dev_vars = [
        Variable(environment_id=dev_env.id, key="baseUrl", value="https://jsonplaceholder.typicode.com"),
        Variable(environment_id=dev_env.id, key="apiKey", value="dev_token_abc123"),
        Variable(environment_id=dev_env.id, key="userId", value="1")
    ]
    prod_vars = [
        Variable(environment_id=prod_env.id, key="baseUrl", value="https://jsonplaceholder.typicode.com"),
        Variable(environment_id=prod_env.id, key="apiKey", value="prod_token_xyz789"),
        Variable(environment_id=prod_env.id, key="userId", value="2")
    ]
    
    # Global Variable
    global_var = Variable(environment_id=None, key="appName", value="PostmanCloneClient")
    
    for v in dev_vars + prod_vars + [global_var]:
        db.add(v)

    # 3. Create Sample Collection
    collection = Collection(
        name="JSONPlaceholder API",
        description="Sample collection for testing jsonplaceholder endpoints with variables"
    )
    db.add(collection)
    await db.flush()

    # 4. Create requests inside collection
    req_get_posts = Request(
        collection_id=collection.id,
        name="Get All Posts",
        method="GET",
        url="{{baseUrl}}/posts",
        headers=json.dumps([
            {"key": "Authorization", "value": "Bearer {{apiKey}}", "enabled": True, "description": "Token Auth"},
            {"key": "X-App-Name", "value": "{{appName}}", "enabled": True}
        ]),
        query_params=json.dumps([
            {"key": "userId", "value": "{{userId}}", "enabled": True, "description": "Filter by userId"}
        ]),
        body_type="none",
        auth_type="none"
    )
    
    req_create_post = Request(
        collection_id=collection.id,
        name="Create Post",
        method="POST",
        url="{{baseUrl}}/posts",
        headers=json.dumps([
            {"key": "Content-Type", "value": "application/json", "enabled": True}
        ]),
        query_params=json.dumps([]),
        body_type="raw",
        body_content=json.dumps({
            "title": "Hello Postman Clone",
            "body": "This request was sent from the client UI.",
            "userId": 1
        }, indent=2),
        auth_type="none"
    )

    db.add(req_get_posts)
    db.add(req_create_post)

    # 5. Create some sample History
    history_items = [
        History(
            name="Get All Posts",
            method="GET",
            url="https://jsonplaceholder.typicode.com/posts?userId=1",
            headers=json.dumps([
                {"key": "Authorization", "value": "Bearer dev_token_abc123", "enabled": True},
                {"key": "X-App-Name", "value": "PostmanCloneClient", "enabled": True}
            ]),
            query_params=json.dumps([
                {"key": "userId", "value": "1", "enabled": True}
            ]),
            body_type="none",
            response_status=200,
            response_time_ms=120,
            response_size_bytes=2450,
            response_headers=json.dumps([
                {"key": "Content-Type", "value": "application/json; charset=utf-8", "enabled": True}
            ]),
            response_body=json.dumps([
                {"id": 1, "title": "Sample Post title", "body": "Sample post body content.", "userId": 1}
            ])
        ),
        History(
            name="Fetch User",
            method="GET",
            url="https://jsonplaceholder.typicode.com/users/1",
            headers=json.dumps([]),
            query_params=json.dumps([]),
            body_type="none",
            response_status=200,
            response_time_ms=95,
            response_size_bytes=580,
            response_headers=json.dumps([
                {"key": "Content-Type", "value": "application/json; charset=utf-8", "enabled": True}
            ]),
            response_body=json.dumps({
                "id": 1,
                "name": "Leanne Graham",
                "username": "Bret",
                "email": "Sincere@april.biz"
            })
        )
    ]
    
    for h in history_items:
        db.add(h)

    await db.commit()
