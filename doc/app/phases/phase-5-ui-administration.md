# Phase 5 — User Interface and Administration

**Duration:** 2–3 months  
**Depends on:** Phase 4 complete (analytics API, escalation endpoints, all backend APIs available)  
**Unlocks:** Phase 6 (Integration, Testing, and Optimization)

---

## Objectives

Build the complete browser-based administration application: a VS Code-inspired single-page application (SPA) using HTML, CSS, and vanilla JavaScript, following the 18 frontend system modules catalogued in [sys/index.md](../../sys/index.md). At the end of this phase every administrator function described in the PRD is accessible through the UI.

---

## Technology Constraints

Per PRD and SRS:
- **HTML + CSS + Vanilla JavaScript only** — no React, Vue, Angular, or any frontend framework
- **No CSS frameworks** — custom CSS following VS Code design language
- **Icons exclusively from Icons8** — loaded via Icons8 CDN or bundled SVGs
- **Responsive** — supports desktop (≥ 1024 px), tablet (768 px), mobile (320 px)
- **Accessible** — WCAG 2.1 AA: keyboard navigation, screen reader support, high-contrast mode

---

## Project Structure

```
frontend/
├── index.html                  # SPA shell — one HTML file
├── css/
│   ├── reset.css
│   ├── variables.css           # Design tokens (VS Code colour palette)
│   ├── layout.css              # Grid/flex layout
│   ├── components/
│   │   ├── sidebar.css
│   │   ├── header.css
│   │   ├── panel.css
│   │   ├── modal.css
│   │   ├── table.css
│   │   ├── form.css
│   │   ├── button.css
│   │   ├── badge.css
│   │   └── toast.css
│   └── views/
│       ├── dashboard.css
│       ├── customers.css
│       ├── funnels.css
│       ├── calls.css
│       ├── agents.css
│       ├── analytics.css
│       └── settings.css
├── js/
│   ├── bootstrap.js            # sys/16 — App Bootstrap & Module System
│   ├── router.js               # sys/1  — Router / Navigation
│   ├── state.js                # sys/2  — State Management
│   ├── storage.js              # sys/3  — Storage Manager
│   ├── http.js                 # sys/4  — HTTP Request Manager
│   ├── events.js               # sys/5  — Event Bus
│   ├── auth.js                 # sys/6  — Authentication & Authorization
│   ├── ui/
│   │   ├── component-system.js # sys/7  — UI Component System
│   │   ├── forms.js            # sys/8  — Form Management
│   │   └── notifications.js    # sys/9  — Notification & Feedback
│   ├── data/
│   │   ├── api.js              # sys/10 — Data Layer / API Integration
│   │   └── cache.js            # sys/18 — HTTP Cache Layer
│   ├── workers/
│   │   └── background.js       # sys/11 — Background Processing
│   ├── utils/
│   │   ├── utility.js          # sys/12 — Utility Library
│   │   ├── search.js           # sys/13 — Search & Filtering
│   │   ├── telemetry.js        # sys/14 — Observability & Telemetry
│   │   ├── i18n.js             # sys/15 — Internationalization
│   │   └── security.js         # sys/17 — Security Layer
│   └── views/
│       ├── dashboard.view.js
│       ├── customers.view.js
│       ├── funnels.view.js
│       ├── calls/
│       │   ├── active-calls.view.js
│       │   ├── call-log.view.js
│       │   └── make-call.view.js
│       ├── agents.view.js
│       ├── analytics.view.js
│       ├── account.view.js
│       └── settings/
│           ├── integrations.view.js
│           ├── scheduling.view.js
│           ├── lead-ingestion.view.js
│           └── security.view.js
├── assets/
│   └── icons/                  # Bundled Icons8 SVGs
└── tests/
    ├── unit/
    └── e2e/
```

---

## Layout Architecture (VS Code-Inspired)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: [Logo] [Org ▼] › [Product ▼] › [Funnel ▼] › [Lead ▼] │
│          ────────────────────────────────── [user] [notif] [?]  │
├───────┬─────────────────────────────────────────────────────────┤
│  ACT  │                                                         │
│  IVIT │           MAIN CONTENT AREA                             │
│  Y    │   (route-specific view rendered here)                   │
│  BAR  │                                                         │
│  (ico │                                                         │
│  ns)  │                                                         │
├───────┤                                                         │
│  STA  │                                                         │
│  TUS  │                                                         │
│  BAR  │                                                         │
└───────┴─────────────────────────────────────────────────────────┘
```

The Activity Bar (left strip) contains tab icons. Clicking an icon expands/collapses a side panel (secondary sidebar). The main content area renders the active view.

---

## sys/16 — Application Bootstrap (`js/bootstrap.js`)

Initialised first; sets up the module system order:

```javascript
// Initialisation order — strictly sequential
1. security.init()          // CSP meta tag, XSS sanitiser setup
2. storage.init()           // LocalStorage / IndexedDB availability check
3. state.init()             // Global store with initial shape
4. events.init()            // Event bus
5. i18n.init(locale)        // Load language strings
6. auth.init()              // Check existing session; redirect to login if none
7. http.init(baseUrl)       // Attach auth headers, CSRF token
8. cache.init()             // HTTP cache warm-up
9. telemetry.init()         // Initialise telemetry (non-blocking)
10. router.init(routes)     // Define routes; navigate to current URL
11. ui.init()               // Register all custom components
12. notifications.init()    // Mount toast container
```

---

## sys/1 — Router (`js/router.js`)

Hash-based routing (`#/path`) using `hashchange` and `History API` fallback.

**Route table:**

| Pattern | View Module | Requires Auth |
|---------|-------------|---------------|
| `#/` | `DashboardView` | Yes |
| `#/customers` | `CustomersView` | Yes |
| `#/customers/:id` | `CustomerDetailView` | Yes |
| `#/funnels` | `FunnelsView` | Yes |
| `#/funnels/:id/editor` | `FunnelEditorView` | Yes (admin) |
| `#/calls/active` | `ActiveCallsView` | Yes |
| `#/calls/log` | `CallLogView` | Yes |
| `#/calls/make` | `MakeCallView` | Yes (admin) |
| `#/agents` | `AgentsView` | Yes (admin) |
| `#/analytics` | `AnalyticsView` | Yes |
| `#/account` | `UserAccountView` | Yes |
| `#/settings/:section` | `SettingsView` | Yes (admin) |
| `#/login` | `LoginView` | No |

**Guard:** Routes with `requiresAuth: true` redirect to `#/login` if no valid session token in storage.

---

## sys/2 — State Management (`js/state.js`)

Centralised immutable state store (no framework — plain JS proxy pattern).

**Global state shape:**

```javascript
const initialState = {
  auth: { user: null, token: null, role: null },
  nav: { activeTab: 'dashboard', breadcrumb: [] },
  customers: { list: [], selected: null, filters: {}, pagination: {} },
  funnels: { list: [], selected: null, stages: [] },
  calls: { active: [], log: [], making: false },
  agents: { list: [], selected: null },
  analytics: { summary: null, charts: {} },
  settings: { current: {} },
  notifications: { queue: [] },
  ui: { loading: false, error: null, theme: 'dark' },
};
```

**Store API:**

```javascript
state.get(path)           // state.get('auth.user')
state.set(path, value)    // Immutable update; triggers events.emit('state.changed', { path, value })
state.subscribe(path, cb) // Subscribe to changes at path
state.dispatch(action)    // Named action: { type, payload }
```

---

## sys/4 — HTTP Request Manager (`js/http.js`)

```javascript
const http = {
  get(path, options)        // Attaches auth header; checks cache; handles 401 refresh
  post(path, body, options)
  put(path, body, options)
  patch(path, body, options)
  delete(path, options)
};
```

- All requests include `X-Correlation-ID` header (UUID v4)
- 401 response triggers token refresh; queues original request
- Network errors: retry once with exponential backoff; show toast on persistent failure
- All request/response pairs logged to `telemetry`

---

## sys/6 — Authentication (`js/auth.js`)

- JWT-based; token stored in `sessionStorage` (not `localStorage` to limit XSS exposure)
- Refresh token in `HttpOnly` cookie (set by backend)
- Login form: email + password
- RBAC roles: `admin`, `sales_manager`, `readonly`
- Route guards check role (`state.get('auth.role')`) before rendering admin views

---

## Sidebar Tabs and Views

### Dashboard (`views/dashboard.view.js`)

**Widgets:**
- Today's calls: total | answered | recovered | escalated | failed
- Weekly conversion rate sparkline
- Recent activity feed (last 10 events)
- Pending escalations count (badge)
- Pending unknown objections count (badge)
- System health indicators (API latency, uptime)

**Implementation tasks:**
- [ ] Call `GET /api/analytics/summary` on mount; poll every 30 s
- [ ] Each widget is a registered custom component (`<lr-metric-card>`, `<lr-sparkline>`, etc.)
- [ ] Empty state: friendly message when no calls have been made yet

### Customers — Tiny CRM (`views/customers.view.js`)

**Features:**
- Paginated list/grid toggle (50 per page)
- Search: name, phone (last 4 digits), lead status
- Filters: lead status, funnel, stage, conversion score range, date range
- Actions per row: View, Initiate Call, View Call History
- Customer detail panel: full profile, funnel context, call history timeline, escalation tickets

**File upload for lead ingestion:**
- Drag-and-drop zone accepting `.csv`, `.json`, and `.xlsx`
- Column mapping UI: map file columns → `Lead` fields
- Validation preview: show first 10 rows; flag errors
- Import progress bar (chunked upload via `POST /api/leads/import`)

**Implementation tasks:**
- [ ] `SearchService.search(query, entities)` for client-side filtering of loaded data
- [ ] Virtual list rendering for > 500 rows (DOM recycling)
- [ ] `FileUploadComponent` with drag/drop, MIME validation, size limit (10 MB)
- [ ] CSV/JSON/XLSX parsing pipeline (sheetjs for XLSX, native FileReader for CSV/JSON)

### Products & Funnels (`views/funnels.view.js` + `FunnelEditorView`)

**Features:**
- List of products and their associated funnels
- Funnel status toggle (active/inactive)
- **Drag-and-drop funnel editor:**
  - Stage cards arranged in vertical swimlane
  - Drag to reorder stages
  - Add/remove/edit stages inline
  - Stage detail panel: title, goal, description, policies, objections (system + customer)
  - Parallel stage support: side-by-side lane rendering
  - Save/discard changes
  - Preview mode: read-only visual representation

**Implementation tasks:**
- [ ] Drag-and-drop: native HTML5 drag events (no library)
- [ ] Stage card component: `<lr-stage-card>` — draggable, collapsible, editable
- [ ] Objection list within stage card: add/edit/remove with inline form
- [ ] `PUT /api/funnels/:id` on save with optimistic UI update + rollback on error
- [ ] Undo stack: last 10 edits undoable within session

### Calls

#### Active Calls (`views/calls/active-calls.view.js`)
- Live list of in-progress calls with customer name, funnel, stage, duration counter
- Click → real-time transcript panel (poll `GET /api/calls/:id/transcript` every 2 s) with audio controls for play/pause and volume
- Status badges: ringing | active | in-assessment | completing
- Manual hang-up button (admin only): `POST /api/calls/:id/hang-up`

### User Account (`views/account.view.js`)
- Profile management form: name, email, preferred language, timezone
- Personal settings: notification preferences, transcript refresh interval, accessibility preferences
- Session actions: logout, view active sessions, revoke own other sessions

#### Call Log (`views/calls/call-log.view.js`)
- Historical call records; filterable by date, funnel, stage, outcome
- Click → full transcript, assessment result, detected objections
- Export to CSV: `GET /api/calls/export?format=csv&from=...&to=...`

#### Make Call (`views/calls/make-call.view.js`)
- Manual trigger form: select customer from search-ahead OR enter phone number
- Select funnel and stage
- Optional note (prepended to system prompt)
- Preview: show `ConversationStrategy` before initiating
- Confirm → `POST /api/calls/manual`
- Live status updates after initiation

### Agents (`views/agents.view.js`)
- List of configured AI agent personas (name, language, voice ID, funnel assignments)
- Create/edit/delete persona
- Performance metrics per agent: calls handled, avg score, escalation rate
- Test voice: play TTS sample using current persona settings

### Analytics (`views/analytics.view.js`)
- Date range picker (last 7d / 30d / 90d / custom)
- Charts (vanilla Canvas API):
  - Line chart: daily conversion rate trend
  - Bar chart: calls by outcome (recovered / failed / escalated)
  - Stacked bar: objections encountered by type
  - Funnel chart: stage drop-off visualisation
- Summary KPI cards at top: total calls, conversion rate, avg duration, top objection
- Table: top 10 leads by conversion probability (from `GET /api/analytics/leads/top`)

### Settings

#### Lead Ingestion (`settings/lead-ingestion.view.js`)
- API configuration form: endpoint URL, auth method (API key / OAuth2), field mapping
- Webhook setup: generate/rotate webhook secret; test webhook
- File upload schedule: define periodic import from SFTP/S3 (URI only, no credentials in UI)

#### Scheduling (`settings/scheduling.view.js`)
- Hierarchical time configuration (system → org → product → funnel → lead):
  - Call hours: time range picker
  - Max call attempts
  - Retry interval
  - Timezone selector
- Preview: "leads in this funnel will be called between __ and __ in __"

#### Integrations (`settings/integrations.view.js`)
- Cards for each integration: Sarvam AI, Eleven Labs, Twilio, Exotel, CRM
- Status indicator: connected / disconnected / error
- Configure: API key (masked), base URL, capabilities toggles
- Test connection button → `POST /api/integrations/:id/test`
- Adapter selection: which adapter to use per capability (STT, TTS, telephony, LLM)

#### Security (`settings/security.view.js`)
- User management: list users, invite, assign roles, deactivate
- Active sessions list with revoke option
- Audit log viewer: last 100 administrative actions

---

## sys/7 — UI Component System (`js/ui/component-system.js`)

Custom element registry using `customElements.define`:

| Component | Tag | Description |
|-----------|-----|-------------|
| MetricCard | `<lr-metric-card>` | KPI card with label + value + trend |
| Sparkline | `<lr-sparkline>` | Inline SVG line chart |
| DataTable | `<lr-data-table>` | Sortable, filterable table with virtual scroll |
| Modal | `<lr-modal>` | Accessible focus-trapping dialog |
| Drawer | `<lr-drawer>` | Slide-in side panel |
| FileUpload | `<lr-file-upload>` | Drag/drop upload zone |
| StageCard | `<lr-stage-card>` | Funnel stage card (draggable) |
| SearchInput | `<lr-search-input>` | Debounced search with suggestions |
| TimePicker | `<lr-time-picker>` | Time range selector |
| Badge | `<lr-badge>` | Status badge with colour variants |
| Toast | `<lr-toast>` | Dismissible notification toast |
| Transcript | `<lr-transcript>` | Scrollable live transcript view |
| AudioPlayer | `<lr-audio-player>` | Call audio controls for play/pause and volume |

Each component:
- Extends `HTMLElement` (not `LitElement` or similar)
- Emits custom DOM events for actions
- Has documented attribute API
- Is keyboard-navigable and screen-reader annotated (`aria-*`)

---

## sys/9 — Notification System (`js/ui/notifications.js`)

```javascript
notifications.show({ type: 'success' | 'error' | 'warning' | 'info', message, duration? })
notifications.persist({ type, message, action? })  // Does not auto-dismiss
notifications.dismiss(id)
```

- Stacks up to 5 simultaneously; older toasts slide out
- Persist critical errors (e.g., call initiation failure) until dismissed
- Link to relevant entity in notification if applicable

---

## sys/14 — Telemetry (`js/utils/telemetry.js`)

- Page view tracking: route changes → `telemetry.pageView(route)`
- User action tracking: button clicks, form submissions → `telemetry.event(category, action, label)`
- Error tracking: `window.onerror` + `unhandledrejection` → `telemetry.error(err)`
- Performance: `PerformanceObserver` for LCP, FID, CLS
- All telemetry sent to `POST /api/telemetry` (backend stores; no third-party analytics in Phase 5)

---

## sys/17 — Security Layer (`js/utils/security.js`)

- Output sanitisation: all user-supplied strings passed through `security.sanitize(str)` before innerHTML injection (strip script tags, event handlers)
- CSP: `Content-Security-Policy` header set by backend; meta tag fallback
- CSRF: double-submit cookie pattern; `http.js` attaches `X-CSRF-Token` header
- Token storage: JWT in `sessionStorage`; refresh token in `HttpOnly` cookie only
- Auth header: `Authorization: Bearer <token>` on all API calls

---

## Build and Asset Pipeline

No bundler required. Files loaded via `<script type="module">` using native ES module imports.

```html
<!-- index.html — only scripts needed -->
<script type="module" src="js/bootstrap.js"></script>
```

**Optimisation for production:**
- One-command concatenate + minify: `npm run build:frontend` (uses `esbuild` — only dev tool, not runtime dependency)
- Output: `frontend/dist/bundle.js` + `frontend/dist/bundle.css`
- Asset hashing for cache busting

---

## Testing Strategy

| Test Type | Tool | Scope |
|-----------|------|-------|
| Unit: components | Jest + JSDOM | Each custom element renders and emits events correctly |
| Unit: state | Jest | State transitions for all actions |
| Unit: router | Jest | Route matching, guards, breadcrumb generation |
| Unit: security | Jest | XSS sanitiser strips malicious strings |
| E2E: critical paths | Playwright | Login, view dashboard, initiate a call, view transcript |

**Critical E2E paths:**
1. Login → view dashboard with metrics
2. Upload CSV/JSON/XLSX → review column mapping → import leads
3. Create funnel → add stage → add objection → save
4. Initiate manual call → view live transcript
5. View analytics charts for last 30 days
6. Approve pending unknown objection

---

## Acceptance Criteria

- [ ] SPA loads and renders in < 2 s on a 4G connection (Lighthouse ≥ 85 performance score)
- [ ] All sidebar tabs reachable via keyboard (Tab + Enter)
- [ ] Login, session expiry, and role-based route guards work correctly
- [ ] Dashboard widgets show correct data from API
- [ ] CSV/JSON/XLSX lead import completes successfully and leads appear in customers list
- [ ] Funnel editor drag-and-drop reorders stages; save persists changes
- [ ] Active calls view updates transcript in real time (polling) and exposes working audio controls
- [ ] All forms validate inputs before submission; errors display inline
- [ ] All E2E tests pass against the backend running in test mode
- [ ] Lighthouse accessibility score ≥ 90
- [ ] No `innerHTML` assignments without `security.sanitize()` (linted)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Drag-and-drop complexity without library | High | Medium | Encapsulate in `StageCard` component; test thoroughly; fallback to up/down arrow buttons |
| Virtual list performance on large datasets | Medium | Medium | Implement early; benchmark with 1000+ rows in CI |
| Real-time transcript polling latency | Low | Low | WebSocket upgrade path planned for Phase 6; polling is acceptable for Phase 5 |
| CSRF token mismatch after session expiry | Medium | High | Token regenerated on login; all forms re-fetch token on mount |
| Icons8 CDN unavailability | Low | Low | Bundle critical icons as inline SVGs; CDN only for non-critical |
