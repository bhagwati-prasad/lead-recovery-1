# Frontend (Next.js)

This folder contains the new Next.js frontend for the Lead Recovery System.

The legacy vanilla JS frontend was moved to `../frontend-old` and remains the behavioral baseline while migration is in progress.

## Goals

- Migrate from vanilla JS to Next.js incrementally (route-by-route).
- Preserve behavior parity with existing frontend before redesign.
- Keep backend API contracts stable during migration.
- Improve maintainability through typed modules, shared UI primitives, and testable feature boundaries.

## Stack

- Next.js (App Router)
- TypeScript
- React
- Existing backend service as source of truth for `/api/...` endpoints

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Backend API running locally (default: `http://localhost:3000`)

### Run frontend

From this folder:

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000` (or the port shown by Next.js if 3000 is in use)

### Run with backend

Start backend from `../backend`:

```bash
npm install
npm run start:dev
```

If you run frontend and backend on the same default port, start one of them on a different port.

## Scripts

- `npm run dev`: start Next.js in development mode
- `npm run build`: production build
- `npm run start`: run production build
- `npm run lint`: run eslint

## Backend API Surface Used by Frontend

Current baseline endpoints (from legacy frontend behavior):

- `GET /api/health`
- `GET /api/workflow/modules`
- `POST /api/workflow/execute`
- `POST /api/workflow/simulate-call`

Example payload for workflow execute:

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

## Target Frontend Architecture

- `app/`: route structure and layouts
- `components/`: reusable UI primitives
- `features/`: domain modules (`customers`, `integrations`, `logs`, etc.)
- `lib/api/`: HTTP client and endpoint wrappers
- `lib/state/`: shared client-side state utilities as needed
- `styles/`: global and feature-level styles

## Migration Status and Source Docs

- Legacy frontend baseline: `../frontend-old/README.md`
- Migration plan: `../frontend-old/nextjs-migration.md`
- Execution tracker: `../frontend-old/nextjs-migration-tracker.md`

Current tracker snapshot:

- Program status: Not Started
- Current phase: Phase 0 (Discovery and Baseline)
- Completion: 0%

## Migration Phases (Summary)

1. Discovery and baseline capture
2. Next.js bootstrap and shared foundation
3. Design system and reusable primitives
4. Customers route migration (first vertical slice)
5. Integrations and Logs migration (including SSE + fallback)
6. Remaining route migration and navigation completion
7. Performance, SEO, and hardening
8. Cutover and legacy cleanup

## Definition of Done (Migration)

- All major routes migrated to Next.js
- Existing backend endpoints fully supported
- Parity checklist passes per migrated route
- Lint/typecheck/build/test gates are green
- Legacy frontend entrypoints retired
