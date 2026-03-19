# Frontend UI Migration Plan

## Goal
Migrate from monolithic JS-rendered views to a scalable architecture using static HTML shells, fetched templates, and targeted DOM updates.

This plan starts with Customers view and then scales to other complex views.

## Why This Migration
- Reduce UI jitter by avoiding full view re-renders.
- Improve maintainability as views become intricate.
- Make changes safer through separation of concerns.
- Enable incremental adoption without rewriting the whole frontend.

## Target Architecture
For each major view:
- Static shell HTML for stable layout.
- Fetched template fragments for repeated rows/cards.
- View controller for orchestration.
- Renderer functions for minimal DOM patching.
- State module for predictable updates.
- Events module for user interaction wiring.

## Folder Structure Pattern
Example for Customers:

- `frontend/js/views/customers/`
- `frontend/js/views/customers/controller.js`
- `frontend/js/views/customers/renderer.js`
- `frontend/js/views/customers/state.js`
- `frontend/js/views/customers/events.js`
- `frontend/templates/customers/shell.html`
- `frontend/templates/customers/row.template.html`

Keep route entry file thin and only responsible for mounting the controller.

## Phasewise Execution Plan

### Phase 0: Baseline and Inventory
Objective:
- Capture current UI behavior and performance before refactor.

Scope:
- Customers view only.

Tasks:
1. Record current behavior checklist (search, filters, view button, call button, upload flow).
2. Capture baseline render timings for initial load and filter changes.
3. List current DOM structure and selectors used by tests/custom elements.

Deliverables:
- Baseline checklist document.
- Timing snapshot for before/after comparison.

Exit criteria:
- Team agrees on behavior parity targets.

Estimated effort:
- 0.5 day.

### Phase 1: Shared Foundation
Objective:
- Introduce reusable utilities needed by all migrated views.

Scope:
- Shared view helpers only (no feature behavior change).

Tasks:
1. Add template loader utility with in-memory cache.
2. Add optional keyed patch helper for list updates.
3. Define lightweight lifecycle contract: `mount`, `unmount`, optional `refresh`.
4. Add error handling for missing templates and fallback rendering.

Deliverables:
- `templateLoader` utility.
- List patch helper.
- Lifecycle convention doc.

Exit criteria:
- Utilities are used by a small sample view or test harness.
- No regressions in existing routes.

Estimated effort:
- 1 day.

### Phase 2: Customers Vertical Slice (Core Migration)
Objective:
- Migrate Customers view to shell/template/controller architecture with behavior parity.

Scope:
- Customers view complete migration.

Tasks:
1. Move stable layout into `frontend/templates/customers/shell.html`.
2. Move row structure into `frontend/templates/customers/row.template.html`.
3. Split view logic into:
   - `controller.js`
   - `renderer.js`
   - `state.js`
   - `events.js`
4. Keep route file thin and mount controller only.
5. Ensure existing events and notifications behave exactly as before.

Deliverables:
- Customers view migrated with unchanged UX.
- Clear module boundaries for future enhancements.

Exit criteria:
- All baseline behaviors pass parity checks.
- No API contract or route contract changes.

Estimated effort:
- 1.5 to 2 days.

### Phase 3: Performance Hardening
Objective:
- Reduce jitter and render cost on data-heavy interactions.

Scope:
- Customers view optimization only.

Tasks:
1. Replace bulk `innerHTML` list swaps with batched insert (`DocumentFragment`).
2. Add keyed updates where practical.
3. Debounce high-frequency inputs (`search.change`).
4. Add simple instrumentation around render cycles.

Deliverables:
- Lower update latency and reduced DOM churn.
- Measured improvement compared to Phase 0 baseline.

Exit criteria:
- Filter/search interactions are visibly smoother.
- Measured update times improve for realistic datasets.

Estimated effort:
- 1 day.

### Phase 4: Multi-View Rollout
Objective:
- Apply the same architecture to other complex views incrementally.

Scope and order:
1. Integrations
2. Logs
3. Calls
4. Funnels/Analytics

Tasks per view:
1. Extract shell/template fragments.
2. Split into controller/renderer/state/events.
3. Reuse shared template and patch utilities.
4. Validate parity with route-specific checks.

Deliverables:
- Consistent architecture across major views.
- Faster onboarding for future UI changes.

Exit criteria:
- Each migrated view passes behavior parity and performance sanity checks.

Estimated effort:
- 0.5 to 1.5 days per view based on complexity.

### Phase 5: Quality Gates and Guardrails
Objective:
- Prevent regressions and keep the new structure enforceable.

Scope:
- Whole frontend migration standardization.

Tasks:
1. Add regression checks for critical interactions per migrated view.
2. Add lint/convention docs for view module boundaries.
3. Define template placeholder naming and binding conventions.
4. Add migration checklist to PR template.

Deliverables:
- Stable, repeatable migration workflow.
- Lower risk during future UI expansion.

Exit criteria:
- New views follow structure by default.
- Regressions are caught early in review/testing.

Estimated effort:
- 1 day initial setup, then ongoing enforcement.

## Suggested Sprint Breakdown
Sprint 1:
1. Phase 0
2. Phase 1
3. Phase 2 (Customers)

Sprint 2:
1. Phase 3 (Customers performance)
2. Phase 4 (Integrations + Logs)

Sprint 3:
1. Phase 4 (Calls + Funnels/Analytics)
2. Phase 5 (quality gates)

## Performance Rules (Non-negotiable)
- Avoid full-root `innerHTML` replacement after initial mount.
- Patch only changed regions.
- Batch DOM writes.
- Use event delegation on stable containers.
- Debounce high-frequency inputs.
- Introduce virtualization when visible rows become large.

## Data and State Rules
- Normalize API responses in data layer before rendering.
- Keep view state serializable and explicit.
- Keep side effects in controller, not renderer.
- Keep renderer pure (state -> DOM updates only).

## Risks and Mitigations
- Risk: Migration introduces behavior regressions.
  - Mitigation: Keep behavior parity in Phase 2 and add regression checks.

- Risk: Team diverges on folder conventions.
  - Mitigation: Document and enforce structure/lifecycle contracts.

- Risk: Premature abstraction overhead.
  - Mitigation: Start with Customers only, then template utilities evolve from real usage.

## Acceptance Criteria
Customers migration is complete when:
- Existing users see no functional regressions.
- View shell/template are externalized and cached.
- Rendering updates only changed regions.
- Search/filter interactions are smooth under realistic data volume.
- Module boundaries (`controller/renderer/state/events`) are in place.

## Immediate Next Steps
1. Implement shared template loader and caching utility.
2. Create Customers `shell.html` and `row.template.html`.
3. Split Customers logic into controller/renderer/state/events.
4. Validate behavior parity and performance.
5. Use same pattern for Integrations next.
