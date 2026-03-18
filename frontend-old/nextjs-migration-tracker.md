# Next.js Migration Execution Tracker

Related plan: [frontend/nextjs-migration.md](frontend/nextjs-migration.md)

## How to Use
- Update `Status` for each item: `Not Started`, `In Progress`, `Blocked`, `Done`.
- Add an `Owner` and `Target Date` for each task.
- Keep notes brief and action-oriented.
- Update this file at least once per day while migration is active.

## Overall Progress
- Program Status: Not Started
- Current Phase: Phase 0
- Completion: 0%
- Last Updated: 2026-03-18

## Status Legend
- `Not Started`: no implementation work started.
- `In Progress`: active development/testing underway.
- `Blocked`: waiting on dependency/decision/access.
- `Done`: implemented, validated, and accepted.

## Phase Tracker

### Phase 0: Discovery and Baseline
Objective: capture current behavior and performance baseline.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P0-1 | Inventory current routes and user flows |  | Not Started |  |  |
| P0-2 | Identify custom elements and browser APIs in use |  | Not Started |  |  |
| P0-3 | Create behavior parity checklist per view |  | Not Started |  |  |
| P0-4 | Capture baseline performance timings |  | Not Started |  |  |

Exit Criteria:
- Route inventory complete.
- Parity checklist approved.
- Baseline timing report available.

### Phase 1: Next.js Bootstrap and Shared Foundation
Objective: establish Next.js app and shared migration scaffolding.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P1-1 | Initialize Next.js app with TypeScript |  | Not Started |  |  |
| P1-2 | Configure environment variables and backend base URL |  | Not Started |  |  |
| P1-3 | Build shared API client layer (`lib/api`) |  | Not Started |  |  |
| P1-4 | Implement base app layout shell |  | Not Started |  |  |
| P1-5 | Add lint/typecheck/build/test scripts |  | Not Started |  |  |

Exit Criteria:
- App boots locally.
- Backend health endpoint call works.
- CI scripts pass.

### Phase 2: Design System and Core UI Primitives
Objective: create reusable component primitives and UI conventions.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P2-1 | Build shared primitives (Button, Input, Select, Table, Card, Badge) |  | Not Started |  |  |
| P2-2 | Define design tokens (spacing, typography, color) |  | Not Started |  |  |
| P2-3 | Implement loading/empty/error component patterns |  | Not Started |  |  |
| P2-4 | Add accessibility baseline for forms/tables/nav |  | Not Started |  |  |

Exit Criteria:
- Two pages can be built with no new one-off primitives.
- Accessibility baseline validated.

### Phase 3: Customers View Migration (First Vertical Slice)
Objective: migrate customers route with parity.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P3-1 | Create `app/customers/page` |  | Not Started |  |  |
| P3-2 | Build `features/customers` module structure |  | Not Started |  |  |
| P3-3 | Wire customers data APIs via shared client |  | Not Started |  |  |
| P3-4 | Implement search/filter/table/actions parity |  | Not Started |  |  |
| P3-5 | Implement lead upload parity |  | Not Started |  |  |
| P3-6 | Add route-level tests for customers interactions |  | Not Started |  |  |

Exit Criteria:
- Customers parity checklist passes.
- No route/API contract regression.

### Phase 4: Integrations and Logs Migration
Objective: migrate high-interaction views including live stream behavior.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P4-1 | Migrate Integrations route and test workflow |  | Not Started |  |  |
| P4-2 | Migrate Logs route with filter controls |  | Not Started |  |  |
| P4-3 | Implement SSE subscription and reconnect flow |  | Not Started |  |  |
| P4-4 | Keep polling fallback for stream failures |  | Not Started |  |  |
| P4-5 | Add tests for stream and filter behavior |  | Not Started |  |  |

Exit Criteria:
- Integrations and Logs parity confirmed.
- SSE + fallback stable under failure/reconnect.

### Phase 5: Remaining Routes and Navigation Completion
Objective: complete migration of all remaining routes.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P5-1 | Migrate Calls route |  | Not Started |  |  |
| P5-2 | Migrate Funnels route |  | Not Started |  |  |
| P5-3 | Migrate Analytics route |  | Not Started |  |  |
| P5-4 | Migrate Agents route |  | Not Started |  |  |
| P5-5 | Migrate Settings route |  | Not Started |  |  |
| P5-6 | Replace hash routing with App Router paths |  | Not Started |  |  |

Exit Criteria:
- All user-facing routes available in Next.js.
- Navigation parity validated.

### Phase 6: Performance, SEO, and Hardening
Objective: optimize and harden after parity.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P6-1 | Evaluate server/client rendering boundaries |  | Not Started |  |  |
| P6-2 | Add dynamic imports and bundle optimization |  | Not Started |  |  |
| P6-3 | Add caching strategy for API-heavy routes |  | Not Started |  |  |
| P6-4 | Run accessibility and regression full pass |  | Not Started |  |  |
| P6-5 | Establish route-level performance budgets |  | Not Started |  |  |

Exit Criteria:
- Performance targets met.
- Reliability and accessibility checks pass.

### Phase 7: Cutover and Cleanup
Objective: production switch and legacy retirement.

| ID | Task | Owner | Status | Target Date | Notes |
|---|---|---|---|---|---|
| P7-1 | Stage rollout with feature flag or percent traffic |  | Not Started |  |  |
| P7-2 | Monitor telemetry/error rates during cutover |  | Not Started |  |  |
| P7-3 | Remove legacy frontend entrypoints/assets |  | Not Started |  |  |
| P7-4 | Update onboarding and runbook docs |  | Not Started |  |  |

Exit Criteria:
- Stable production metrics after cutover.
- Legacy frontend retired.

## Cross-Cutting Trackers

### Dependency Tracker
| Dependency | Needed For | Status | Notes |
|---|---|---|---|
| Backend API compatibility lock | All phases | Not Started | Freeze contracts during migration |
| CI updates for Next.js build/test | Phase 1+ | Not Started |  |
| E2E smoke harness | Phase 3+ | Not Started |  |

### Risk Tracker
| Risk | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|
| Behavior regressions during route migration | High | Parity checklist + tests per route |  | Not Started |
| SSE behavior mismatch in Next runtime | Medium | Keep polling fallback + reconnect logic |  | Not Started |
| Scope creep due redesign requests | Medium | Freeze visual redesign until parity done |  | Not Started |

### Decision Log
| Date | Decision | Context | Owner |
|---|---|---|---|
| 2026-03-18 | Tracker created | Execution governance for Next.js migration |  |

## Weekly Review Template
- Week:
- Completed:
- In Progress:
- Blockers:
- Risks Updated:
- Next Week Focus:
