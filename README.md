# Postman Clone — SDE Fullstack API Client Client

A high-fidelity, premium fullstack clone of the Postman desktop workspace. Replicates Postman's page hierarchy, layout styling, browser-like tabs, resizable layout panes, key/value editors, variables resolution, and chronological history tracking.

---

## 🚀 Tech Stack

### Frontend
*   **Framework**: Next.js App Router (TypeScript)
*   **Styling**: Tailwind CSS (Dark theme first, premium aesthetics)
*   **State Management**: Zustand (UI workspace stores, tab configurations, URL/parameters synchronizer)
*   **Server State (Cache)**: TanStack Query (Server database mutations/fetches)
*   **Resizable Panels**: `react-resizable-panels` (High density layouts)
*   **Icons**: Lucide React

### Backend
*   **Framework**: Python with FastAPI (Async endpoints)
*   **Database**: SQLite (SQLAlchemy async sessions)
*   **HTTP client**: HTTPX (Proxy request runner executing real network request requests)
*   **Request/Response Validation**: Pydantic v2 schemas

---

## 🛠️ Getting Started & How to Run

Both the Backend and Frontend are already configured to start up and run. If you need to restart them manually, follow these instructions:

### Prerequisites
*   Python 3.10+
*   Node.js 18+

### 1. Running the FastAPI Backend
Open a terminal in the root directory:
```bash
# Navigate to backend
cd backend

# Create virtual environment (if not already set up)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server on port 8000
python -m uvicorn app.main:app --port 8000 --reload
```
The backend API documentation is available at **http://localhost:8000/docs**.

### 2. Running the Next.js Frontend
Open another terminal:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js dev server on port 3000
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🗄️ Database ER Diagram (SQLite)

The database schema is fully normalized and handles all state relations:

```
+------------------+         +------------------+
|   collections    |         |     requests     |
+------------------+         +------------------+
| id (PK)          | <-----+ | id (PK)          |
| name             |         | collection_id(FK)|
| description      |         | name             |
| parent_id (FK)   |         | method, url      |
| created/updated  |         | headers (JSON)   |
+------------------+         | query_params     |
                             | body_type, body  |
+------------------+         | auth_type, auth  |
|   environments   |         +------------------+
+------------------+                   |
| id (PK)          |                   |
| name             |                   v
| created/updated  |         +------------------+
+------------------+         |       tabs       |
         |                   +------------------+
         v                   | id (PK)          |
+------------------+         | request_id (FK)  |
|    variables     |         | name, method     |
+------------------+         | url, headers     |
| id (PK)          |         | query_params     |
| environment_id(FK)         | body_type, body  |
| key, value       |         | is_dirty, active |
+------------------+         +------------------+
```

---

## 🌟 Key Implementations

### Variable Resolution Engine
Before executing requests, the backend compiles URLs, headers, configurations, and request bodies looking for `{{variable_name}}` templates. It resolves keys in order of **Selected Active Environment** $\rightarrow$ **Globals (fallback)**. It handles nested resolutions iteratively (e.g. `{{baseUrl}}` containing `{{port}}`).

### Proxy Outbound Runner
Outbound network requests are performed by the backend to bypass browser **CORS limits**. The runner handles:
*   Real network latencies (tracked via `perf_counter` in milliseconds).
*   SSL errors (verifications disabled by default to support local testing).
*   Connection failure / timeouts / malformed URLs (gracefully converted into client-friendly error metrics rather than breaking).
*   Automatic logging to `History` upon successful outbound request executions.

### Tab Persistence Sync
The database includes a `tabs` table mapping browser workspace session tabs. Opening tabs, closing tabs, and dirty edits are serialized to the database so that reloading the browser client restores the exact layout state.
