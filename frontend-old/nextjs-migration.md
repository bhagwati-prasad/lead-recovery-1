# Next.js Migration Plan (Frontend)

## Goal
Migrate the current vanilla JS frontend to Next.js with minimal business-logic regressions, improved maintainability, and better long-term scalability for complex views.

## Migration Principles
- Keep backend APIs unchanged during initial migration.
- Ship incrementally by route, not big-bang rewrite.
- Preserve UX parity first, optimize second.
- Isolate API/data access behind a single client layer.
- Add guardrails (tests, lint, type checks) as part of migration, not after.

## Target Stack
- Next.js (App Router)
- TypeScript
- React Server Components where useful
- Client Components for interactive screens
- Existing backend remains source of truth (`/api/...` on backend service)

## Target Architecture
- `app/` for route structure and layouts
- `components/` for reusable UI elements
- `features/` for domain modules (`customers`, `integrations`, `logs`, etc.)
- `lib/api/` for HTTP client and endpoint wrappers
- `lib/state/` for client state utilities (as needed)
- `styles/` for global and module styles

## Phasewise Plan

### Phase 0: Discovery and Baseline
Objective:
- Capture current behavior and performance baseline before migration.

Tasks:
1. Inventory all current routes and user flows.
2. Identify custom elements and browser APIs currently used.
3. Record baseline UX parity checklist for each view.
4. Capture key timings (route load, table render, filter/search response).

Deliverables:
- Route inventory
- Parity checklist
- Baseline performance snapshot

Exit criteria:
- Agreed migration order and parity acceptance criteria.

Estimated effort:
- 1 day

### Phase 1: Next.js Bootstrap and Shared Foundation
Objective:
- Establish new Next.js app and migration scaffolding.

Tasks:
1. Initialize Next.js app with TypeScript.
2. Configure environment variables for backend base URL.
3. Build shared API client layer (`lib/api/client.ts`).
4. Add base layout shell (sidebar/header placeholders).
5. Add linting/typecheck/test scripts.

Deliverables:
- Running Next.js app shell
- Shared API client abstraction
- CI-ready scripts for lint/typecheck/build

Exit criteria:
- App boots and can call backend health endpoint successfully.

Estimated effort:
- 1 to 1.5 days

### Phase 2: Design System and Core UI Primitives
Objective:
- Create reusable primitives to avoid ad-hoc component growth.

Tasks:
1. Build common components (Table, Button, Input, Select, Badge, Card, Toast).
2. Establish typography/spacing/color tokens.
3. Add loading and error UI patterns.
4. Create accessibility baseline for forms/tables/navigation.

Deliverables:
- Reusable component primitives
- Shared style tokens and conventions

Exit criteria:
- Two migrated pages can share the same primitive set without custom hacks.

Estimated effort:
- 1.5 to 2 days

### Phase 3: Customers View Migration (First Vertical Slice)
Objective:
- Migrate Customers view end-to-end with parity.

Tasks:
1. Implement `app/customers/page.tsx`.
2. Move current table/filter/search logic into feature module (`features/customers`).
3. Wire existing endpoints (`getCustomers`, `uploadLeads`) through new API layer.
4. Keep behavior parity for search/filter/actions/upload notifications.
5. Add route-level tests for primary interactions.

Deliverables:
- Customers page in Next.js with parity
- Feature module pattern validated

Exit criteria:
- Customers page passes parity checklist and smoke tests.

Estimated effort:
- 2 to 3 days

### Phase 4: Integrations and Logs Migration
Objective:
- Migrate complex, interactive views with live updates.

Tasks:
1. Migrate Integrations page with existing test-connection workflow.
2. Migrate Logs page with SSE subscription and polling fallback.
3. Keep query/filter semantics aligned with backend endpoints.
4. Add client-side resilience for stream reconnect and errors.

Deliverables:
- Next.js Integrations page
- Next.js Logs page (SSE + fallback)

Exit criteria:
- Live logs and integration checks behave same or better than current UI.

Estimated effort:
- 2 to 3 days

### Phase 5: Remaining Routes and Navigation Completion
Objective:
- Complete migration of remaining screens and route wiring.

Tasks:
1. Migrate Calls, Agents, Funnels, Analytics, Settings pages.
2. Replace hash-based routing with App Router paths.
3. Ensure deep-linking and back/forward behavior parity.
4. Remove legacy route glue code from migrated areas.

Deliverables:
- Full route coverage in Next.js
- Unified navigation model

Exit criteria:
- All user-facing routes available in Next.js.

Estimated effort:
- 4 to 6 days (depends on view complexity)

### Phase 6: Performance, SEO, and Hardening
Objective:
- Leverage Next.js strengths after parity is achieved.

Tasks:
1. Introduce server rendering where beneficial.
2. Optimize bundle splits and dynamic imports.
3. Add caching strategy for API-heavy screens.
4. Add monitoring for route and interaction performance.
5. Run accessibility and regression test pass.

Deliverables:
- Performance tuning report
- Hardened release candidate

Exit criteria:
- Meets agreed performance and reliability targets.

Estimated effort:
- 2 days

### Phase 7: Cutover and Cleanup
Objective:
- Switch production traffic to Next.js and retire legacy frontend.

Tasks:
1. Deploy Next.js behind feature flag or staged rollout.
2. Observe error/performance telemetry.
3. Remove old frontend assets and dead code.
4. Update docs and onboarding guide.

Deliverables:
- Production cutover completed
- Legacy frontend retired

Exit criteria:
- Stable post-cutover metrics and no critical regressions.

Estimated effort:
- 1 to 2 days

## Suggested Migration Order
1. Customers
2. Integrations
3. Logs
4. Calls
5. Funnels/Analytics
6. Settings/Agents

This order prioritizes high-change and high-interaction views early.

## Risk Register
- Risk: Behavior regressions during route migration.
  - Mitigation: Parity checklist + route-level tests per phase.

- Risk: Inconsistent data handling across pages.
  - Mitigation: Single API layer + typed response normalization.

- Risk: SSE reliability differences in browser/runtime.
  - Mitigation: Keep polling fallback and reconnection strategy.

- Risk: Scope creep in design refresh during migration.
  - Mitigation: Freeze visual redesign until parity phase completes.

## Definition of Done (Project)
- All major routes migrated to Next.js.
- Existing backend endpoints fully supported.
- Parity checklist passed for each migrated view.
- Lint/typecheck/build/test gates are green.
- Legacy frontend entrypoints removed.

## Immediate Next Steps
1. Create Next.js app scaffold under `frontend-next/` (or replace `frontend/` after alignment).
2. Implement shared API client and environment config.
3. Start Phase 3 with Customers view as first vertical slice.
