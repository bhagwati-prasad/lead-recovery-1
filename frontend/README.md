# Frontend (Vanilla JS)

## Run Phase 1 Locally

### Option A: Run All with Docker Compose

From `infra`:

```bash
docker compose up
```

Then open:

- http://localhost:5173

Services started:

- Backend API on http://localhost:3000/api
- Frontend static app on http://localhost:5173

1. Start backend API (from `backend`):

```bash
npm install
npm run start:dev
```

2. Serve frontend statically (from `frontend`):

```bash
python3 -m http.server 5173
```

3. Open:

- http://localhost:5173

Default API base URL in the page is:

- http://localhost:3000/api

## REST Surface used by frontend

- `GET /api/health`
- `GET /api/workflow/modules`
- `POST /api/workflow/execute`
- `POST /api/workflow/simulate-call`

### Sample execute payload

```json
{
  "moduleId": "customer-data-retrieval",
  "input": {
    "leadId": "lead_001"
  },
  "context": {
    "customerId": "cust-001",
    "funnelId": "funnel-001",
    "stageId": "phase-1"
  }
}
```
