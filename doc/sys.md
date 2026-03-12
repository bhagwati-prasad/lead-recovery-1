# Enterprise-Grade Event-Driven SPA — Exhaustive Component Architecture

Here's a comprehensive breakdown organized by domain:

---

# Module 1 — 🧭 Router / Navigation System

> **Core Principle:** The URL is the single source of truth for application state. Every navigable state the user can reach must be expressible as a URL, and every URL must deterministically produce the same application state.

---

## Architecture Overview

```
window.location / window.history
            │
            ▼
    ┌───────────────────┐
    │   History Manager │  ← owns the browser History API
    └────────┬──────────┘
             │ fires navigation intent
             ▼
    ┌───────────────────┐
    │  Navigation Guard │  ← before/after hooks, can cancel
    └────────┬──────────┘
             │ approved
             ▼
    ┌───────────────────┐     ┌─────────────────────┐
    │    Path Router    │────►│ Route Transition Mgr │
    └────────┬──────────┘     └─────────────────────┘
             │ matched route
     ┌───────┼────────────┐
     ▼       ▼            ▼
  Query    Fragment    Scroll
  Param    Manager    Restoration
  Manager             Manager
     │
     ▼
  Deep Link Resolver
  Canonical URL Builder
```

---

## 1.1 — Path Router

### Responsibility
Maps URL pathnames to route definitions. Resolves dynamic segments, supports nested routes, and drives the root rendering decision.

### Route Definition Interface

```js
/**
 * @typedef {Object} RouteDefinition
 * @property {string}                     path        - Pattern string. Supports :param, *wildcard, (optional?)
 * @property {string}                     name        - Unique symbolic name e.g. 'user.profile'
 * @property {() => Promise<RouteHandler>} component  - Async factory; enables code-splitting
 * @property {RouteDefinition[]}          [children]  - Nested child routes
 * @property {Object}                     [meta]      - Arbitrary metadata: auth, title, flags
 * @property {string}                     [redirect]  - Redirect to named route or path string
 * @property {boolean}                    [exact]     - Default true; false allows prefix matching
 */

/**
 * @typedef {Object} RouteHandler
 * @property {function(RouteContext): void}  onEnter  - Called when route becomes active
 * @property {function(RouteContext): void}  onLeave  - Called when route is being left
 * @property {function(RouteContext): void}  render   - Renders the view into the outlet
 */

/**
 * @typedef {Object} RouteContext
 * @property {string}               path       - Matched path string
 * @property {Object.<string,string>} params   - Dynamic segments e.g. { id: '42' }
 * @property {QueryParams}          query      - Parsed query parameters (see 1.2)
 * @property {string}               fragment   - Hash fragment without '#'
 * @property {RouteDefinition}      route      - The matched route definition
 * @property {RouteDefinition|null} parent     - Parent route if nested
 * @property {any}                  state      - History state payload
 */
```

### PathRouter Class

```js
class PathRouter {
  /** @type {RouteDefinition[]} */
  #routes = [];

  /** @type {RouteContext|null} */
  #currentContext = null;

  /** @type {Map<string, RegExp>} */
  #compiledPatterns = new Map();

  /**
   * Register route definitions. Call once at boot.
   * @param {RouteDefinition[]} routes
   */
  register(routes) {}

  /**
   * Resolve a pathname to a matched route and extracted params.
   * Returns null if no route matched.
   * @param {string} pathname
   * @returns {{ route: RouteDefinition, params: Object } | null}
   */
  resolve(pathname) {}

  /**
   * Programmatically navigate to a named route.
   * Delegates to HistoryManager.push()
   * @param {string} name         - Route name
   * @param {Object} [params]     - Dynamic segment values
   * @param {Object} [query]      - Query parameters
   * @param {string} [fragment]   - Hash fragment
   */
  navigate(name, params = {}, query = {}, fragment = '') {}

  /**
   * Replace current history entry without adding a new one.
   * @param {string} name
   * @param {Object} [params]
   * @param {Object} [query]
   * @param {string} [fragment]
   */
  replace(name, params = {}, query = {}, fragment = '') {}

  /**
   * Returns the currently active RouteContext.
   * @returns {RouteContext|null}
   */
  getCurrentContext() {}

  /**
   * Subscribe to route change events.
   * @param {function(RouteContext): void} handler
   * @returns {function} unsubscribe
   */
  onChange(handler) {}
}
```

### Pattern Compilation Rules

| Pattern token | Meaning | Example | Matches |
|---|---|---|---|
| `:param` | Required named segment | `/users/:id` | `/users/42` → `{ id: '42' }` |
| `:param?` | Optional named segment | `/users/:id?` | `/users` or `/users/42` |
| `*` | Wildcard (rest of path) | `/files/*` | `/files/a/b/c` |
| `(regex)` | Inline regex constraint | `/items/:id(\\d+)` | Only numeric ids |

Pattern compilation produces a `RegExp` with named capture groups. Compiled patterns are cached in `#compiledPatterns` keyed by pattern string.

### Route Matching Algorithm

```
1. Flatten all registered routes into a depth-first ordered list
   (children are inserted after their parent)
2. For each candidate route (in order):
   a. Compile pattern → RegExp (or retrieve from cache)
   b. Test pathname against RegExp
   c. On match: extract named captures as params{}
   d. If route has a redirect: resolve redirect target and restart
   e. Return { route, params }
3. If no match: return null → render 404 outlet
```

---

## 1.2 — Query Parameter Manager

### Responsibility
Treats the query string as a typed, structured filter/options object. The raw string is never manipulated directly by application code.

### Interfaces

```js
/**
 * @typedef {Object} QueryParamSchema
 * @property {'string'|'number'|'boolean'|'array'|'json'} type
 * @property {*}       [default]     - Value used when param is absent
 * @property {boolean} [persist]     - Write to URL on set (default true)
 * @property {number}  [min]         - For numeric types
 * @property {number}  [max]         - For numeric types
 * @property {Array}   [enum]        - Allowlist of values
 */

/**
 * @typedef {Object.<string, QueryParamSchema>} QuerySchemaMap
 * Map of param name → schema. Registered per route or globally.
 */
```

```js
class QueryParamManager {
  /** @type {QuerySchemaMap} */
  #schema = {};

  /**
   * Register schema for current route's query params.
   * Called by PathRouter when a new route is matched.
   * @param {QuerySchemaMap} schema
   */
  registerSchema(schema) {}

  /**
   * Parse a raw query string into a typed object.
   * Applies defaults, coerces types, strips unknown params (if strict).
   * @param {string} queryString  - e.g. '?page=2&active=true&tags=a,b'
   * @param {boolean} [strict]    - Drop params not in schema (default false)
   * @returns {Object}
   */
  parse(queryString, strict = false) {}

  /**
   * Serialize a params object back to a query string.
   * Omits params matching their default value (keeps URLs clean).
   * Sorts keys for canonical output.
   * @param {Object} params
   * @returns {string}  - e.g. 'page=2&tags=a%2Cb'
   */
  serialize(params) {}

  /**
   * Return the current parsed query params.
   * @returns {Object}
   */
  getAll() {}

  /**
   * Read a single typed param by key.
   * @param {string} key
   * @returns {*}
   */
  get(key) {}

  /**
   * Set one or more params and push/replace URL.
   * Merges with current params; does not clobber unrelated keys.
   * @param {Object} updates
   * @param {'push'|'replace'} [mode='replace']
   */
  set(updates, mode = 'replace') {}

  /**
   * Remove one or more params from URL.
   * @param {string|string[]} keys
   */
  remove(keys) {}

  /**
   * Compute a diff between two param objects.
   * Returns { added, removed, changed } key sets.
   * Used by NavigationGuards to detect filter changes.
   * @param {Object} prev
   * @param {Object} next
   * @returns {{ added: string[], removed: string[], changed: string[] }}
   */
  diff(prev, next) {}

  /**
   * Subscribe to query param changes.
   * @param {function(current: Object, diff: Object): void} handler
   * @returns {function} unsubscribe
   */
  onChange(handler) {}
}
```

### Type Coercion Rules

```
Raw string     Schema type     Coerced value
─────────────────────────────────────────────
'true'         boolean         true
'false'        boolean         false
'42'           number          42
'3.14'         number          3.14
'a,b,c'        array           ['a', 'b', 'c']
'%5B1%2C2%5D'  json            [1, 2]    (URL-decoded then JSON.parsed)
'hello'        string          'hello'
(absent)       any             schema.default
```

---

## 1.3 — Fragment Manager

### Responsibility
Treats the URL `#fragment` as a first-class UI state carrier. Fragments are **namespaced** so multiple independent UI states can coexist in one fragment string without collisions.

### Fragment Format

```
#ns1:value1|ns2:value2|ns3:value3

Examples:
  #modal:new-user          → modal 'new-user' is open
  #modal:new-user|tab:settings   → modal open AND settings tab active
  #section:billing         → billing section is focused/scrolled to
```

### Interface

```js
/**
 * @typedef {Object} FragmentEntry
 * @property {string} namespace
 * @property {string} value
 */
```

```js
class FragmentManager {
  /**
   * Parse the raw fragment string into a namespace map.
   * @param {string} [raw]  - Defaults to window.location.hash
   * @returns {Object.<string, string>}  - e.g. { modal: 'new-user', tab: 'settings' }
   */
  parse(raw) {}

  /**
   * Get the value for a specific namespace.
   * @param {string} namespace
   * @returns {string|null}
   */
  get(namespace) {}

  /**
   * Set a namespaced fragment value.
   * Merges with existing namespaces; replaces history entry by default.
   * @param {string} namespace
   * @param {string} value
   * @param {'push'|'replace'} [mode='replace']
   */
  set(namespace, value, mode = 'replace') {}

  /**
   * Remove a namespace from the fragment.
   * @param {string} namespace
   */
  remove(namespace) {}

  /**
   * Clear all fragment namespaces.
   */
  clear() {}

  /**
   * Serialize a namespace map back to a fragment string.
   * @param {Object.<string, string>} map
   * @returns {string}  - e.g. 'modal:new-user|tab:settings'
   */
  serialize(map) {}

  /**
   * Subscribe to changes for a specific namespace (or all if omitted).
   * @param {string|null} namespace
   * @param {function(value: string|null): void} handler
   * @returns {function} unsubscribe
   */
  onChange(namespace, handler) {}

  /**
   * Returns true if a namespace currently has any value set.
   * @param {string} namespace
   * @returns {boolean}
   */
  isActive(namespace) {}
}
```

### Common Namespace Conventions

| Namespace | Purpose | Example |
|---|---|---|
| `modal` | Open modal by ID | `#modal:confirm-delete` |
| `tab` | Active tab key | `#tab:payments` |
| `panel` | Expanded side panel | `#panel:filters` |
| `section` | Scroll-to anchor | `#section:billing` |
| `focus` | Focused field/item | `#focus:email-input` |
| `drawer` | Drawer open state | `#drawer:notifications` |

---

## 1.4 — Navigation Guard System

### Responsibility
An ordered middleware pipeline that runs before and after every route transition. Any guard can **cancel**, **redirect**, or **pause** (async) a navigation.

### Interfaces

```js
/**
 * @typedef {Object} NavigationContext
 * @property {RouteContext}  from        - Currently active route context (null on first load)
 * @property {RouteContext}  to          - Incoming route context
 * @property {'push'|'replace'|'pop'} trigger - What caused the navigation
 */

/**
 * @typedef {Object} GuardResult
 * @property {boolean}        proceed    - false cancels navigation
 * @property {string}         [redirect] - Named route or path to redirect to instead
 * @property {string}         [reason]   - Human-readable reason (for logging)
 */

/**
 * @callback GuardFn
 * @param {NavigationContext} context
 * @returns {GuardResult | Promise<GuardResult>}
 */
```

```js
class NavigationGuardSystem {
  /** @type {Array<{ id: string, phase: 'before'|'after', fn: GuardFn, priority: number }>} */
  #guards = [];

  /**
   * Register a guard to run before navigation is committed.
   * Lower priority number runs first.
   * @param {string}   id
   * @param {GuardFn}  fn
   * @param {number}   [priority=100]
   * @returns {function} unregister
   */
  addBeforeGuard(id, fn, priority = 100) {}

  /**
   * Register a guard to run after navigation is committed.
   * After-guards cannot cancel navigation; they are for side-effects.
   * @param {string}   id
   * @param {GuardFn}  fn
   * @param {number}   [priority=100]
   * @returns {function} unregister
   */
  addAfterGuard(id, fn, priority = 100) {}

  /**
   * Run all before-guards in priority order.
   * Stops pipeline on first non-proceed result.
   * @param {NavigationContext} context
   * @returns {Promise<GuardResult>}
   */
  async runBeforeGuards(context) {}

  /**
   * Run all after-guards. Errors are caught and logged; never thrown.
   * @param {NavigationContext} context
   * @returns {Promise<void>}
   */
  async runAfterGuards(context) {}

  /**
   * Remove a registered guard by id.
   * @param {string} id
   */
  remove(id) {}
}
```

### Built-in Guard Factories

```js
// Auth guard — redirect to login if user is not authenticated
NavigationGuardSystem.guards.auth = (authService, loginRoute = 'auth.login') =>
  async ({ to }) => {
    if (!to.route.meta?.requiresAuth) return { proceed: true };
    const isAuthenticated = await authService.isAuthenticated();
    return isAuthenticated
      ? { proceed: true }
      : { proceed: false, redirect: loginRoute, reason: 'unauthenticated' };
  };

// Permission guard — check RBAC before entering route
NavigationGuardSystem.guards.permission = (permissionService) =>
  async ({ to }) => {
    const required = to.route.meta?.permission;
    if (!required) return { proceed: true };
    const allowed = await permissionService.can(required);
    return allowed
      ? { proceed: true }
      : { proceed: false, redirect: 'errors.forbidden', reason: `missing permission: ${required}` };
  };

// Unsaved changes guard — prompt user before leaving dirty forms
NavigationGuardSystem.guards.unsavedChanges = (formRegistry) =>
  async ({ from }) => {
    if (!from) return { proceed: true };
    const dirty = formRegistry.hasDirtyForms();
    if (!dirty) return { proceed: true };
    const confirmed = await Dialog.confirm('You have unsaved changes. Leave anyway?');
    return { proceed: confirmed, reason: confirmed ? 'user-confirmed' : 'user-cancelled' };
  };

// Feature flag guard — block route if flag is off
NavigationGuardSystem.guards.featureFlag = (flagService) =>
  ({ to }) => {
    const flag = to.route.meta?.featureFlag;
    if (!flag) return { proceed: true };
    return flagService.isEnabled(flag)
      ? { proceed: true }
      : { proceed: false, redirect: 'errors.not-found', reason: `flag disabled: ${flag}` };
  };
```

### Guard Execution Flow

```
Navigation Intent
      │
      ▼
[Before Guard 1 (priority 10)] → { proceed: false } ──► CANCEL / REDIRECT
      │ proceed: true
      ▼
[Before Guard 2 (priority 50)] → { proceed: false } ──► CANCEL / REDIRECT
      │ proceed: true
      ▼
[Before Guard N (priority 100)]
      │ all proceed: true
      ▼
History committed + View rendered
      │
      ▼
[After Guard 1] → side effects only (analytics, scroll, title update)
[After Guard 2]
[After Guard N]
```

---

## 1.5 — Route Transition Manager

### Responsibility
Orchestrates the async lifecycle of a route change — teardown of the outgoing view, loading of the incoming route's component, loading state display, and transition animations.

### Interfaces

```js
/**
 * @typedef {'idle'|'loading'|'transitioning'|'error'} TransitionState
 */

/**
 * @typedef {Object} TransitionHooks
 * @property {function(): void}          [onStart]     - Fired when transition begins
 * @property {function(number): void}    [onProgress]  - Fired with 0–100 progress value
 * @property {function(): void}          [onComplete]  - Fired when new view is mounted
 * @property {function(Error): void}     [onError]     - Fired if component load fails
 */
```

```js
class RouteTransitionManager {
  /** @type {TransitionState} */
  #state = 'idle';

  /** @type {AbortController|null} */
  #activeAbort = null;

  /**
   * Execute a route transition from `from` context to `to` context.
   * Handles: abort of previous in-flight transition, component lazy load,
   * loading state, animation, and error boundary.
   *
   * @param {RouteContext}    from
   * @param {RouteContext}    to
   * @param {TransitionHooks} [hooks]
   * @returns {Promise<void>}
   */
  async transition(from, to, hooks = {}) {}

  /**
   * Abort any in-progress transition (e.g. user navigated away mid-load).
   */
  abort() {}

  /**
   * Returns current transition state.
   * @returns {TransitionState}
   */
  getState() {}

  /**
   * Register a named animation to play between specific route pairs.
   * @param {string}   fromPattern  - Route name glob e.g. 'list.*'
   * @param {string}   toPattern
   * @param {function(outEl: Element, inEl: Element): Promise<void>} animFn
   */
  registerAnimation(fromPattern, toPattern, animFn) {}
}
```

### Transition Lifecycle

```
transition(from, to) called
        │
        ├─ abort() any previous in-flight transition
        ├─ state = 'loading'
        ├─ hooks.onStart()
        ├─ emit 'router:transition:start' on Event Bus
        │
        ├─ call from.route.handler.onLeave(from)   [outgoing teardown]
        │
        ├─ await to.route.component()              [dynamic import]
        │       │ loading indicator shown if > 200ms
        │       │ hooks.onProgress(n) as modules load
        │       ├─ SUCCESS → state = 'transitioning'
        │       └─ FAILURE → state = 'error', hooks.onError(err), render error outlet
        │
        ├─ run registered animation(from, to)      [CSS / WAAPI]
        │
        ├─ call to.route.handler.render(to)        [mount new view]
        ├─ call to.route.handler.onEnter(to)
        │
        ├─ state = 'idle'
        ├─ hooks.onComplete()
        └─ emit 'router:transition:complete' on Event Bus
```

---

## 1.6 — History Manager

### Responsibility
Single owner of the browser History API. All code that wants to manipulate the URL goes through this class — never calls `history.pushState` directly.

```js
/**
 * @typedef {Object} HistoryEntry
 * @property {string}  path       - Full path + query + fragment
 * @property {any}     state      - Arbitrary serializable state payload
 * @property {string}  key        - Unique entry key (UUID)
 * @property {number}  timestamp  - When entry was created
 */
```

```js
class HistoryManager {
  /** @type {HistoryEntry[]} */
  #stack = [];

  /** @type {number} */
  #cursor = -1;

  /**
   * Initialize. Binds to window.popstate.
   * Reconstructs in-memory stack from sessionStorage if available.
   */
  init() {}

  /**
   * Push a new entry. Deduplicates: if new path === current path, does nothing.
   * @param {string} path   - Full URL path with query and fragment
   * @param {any}    [state]
   */
  push(path, state = null) {}

  /**
   * Replace current entry without adding to stack.
   * @param {string} path
   * @param {any}    [state]
   */
  replace(path, state = null) {}

  /**
   * Navigate back. No-ops if at start of stack.
   */
  back() {}

  /**
   * Navigate forward. No-ops if at end of stack.
   */
  forward() {}

  /**
   * Navigate by delta (positive = forward, negative = back).
   * @param {number} delta
   */
  go(delta) {}

  /**
   * Returns the current HistoryEntry.
   * @returns {HistoryEntry|null}
   */
  getCurrent() {}

  /**
   * Returns true if there is a previous entry to go back to.
   * @returns {boolean}
   */
  canGoBack() {}

  /**
   * Returns true if there is a forward entry.
   * @returns {boolean}
   */
  canGoForward() {}

  /**
   * Returns a copy of the full navigation stack.
   * @returns {HistoryEntry[]}
   */
  getStack() {}

  /**
   * Subscribe to navigation events (push, replace, pop).
   * @param {function(HistoryEntry, 'push'|'replace'|'pop'): void} handler
   * @returns {function} unsubscribe
   */
  onChange(handler) {}
}
```

### Duplicate Prevention Logic

```
push('/users?page=2') called
    │
    ├── normalize new path (sort query keys, lowercase scheme)
    ├── normalize current path
    │
    ├── if normalized(new) === normalized(current):
    │       do nothing, return                        ← DEDUPLICATED
    │
    └── else:
            history.pushState(state, '', path)
            append to #stack, advance #cursor
            notify subscribers
```

---

## 1.7 — Scroll Restoration Manager

### Responsibility
Saves the scroll position of the page and any registered nested scroll containers when leaving a route, and restores them when returning to it (back/forward navigation). On fresh navigation, scrolls to the top (or to a `#section` fragment target).

```js
class ScrollRestorationManager {
  /** @type {Map<string, ScrollSnapshot>} */
  #snapshots = new Map();

  /** @type {Set<string>} */
  #containers = new Set();

  /**
   * Initialize. Must be called once at boot.
   * Sets history.scrollRestoration = 'manual' to take over from browser.
   */
  init() {}

  /**
   * Register a CSS selector for a nested scroll container
   * that should have its position saved/restored alongside the page.
   * @param {string} selector  - e.g. '.data-table', '#sidebar'
   */
  registerContainer(selector) {}

  /**
   * Save scroll positions for the current route key.
   * Called by NavigationGuard (before phase) on every navigation.
   * @param {string} routeKey  - Unique key from HistoryEntry.key
   */
  save(routeKey) {}

  /**
   * Restore scroll positions for a route key.
   * Called by RouteTransitionManager (after view mounts).
   * @param {string}      routeKey
   * @param {RouteContext} context   - Used to detect #section fragments
   */
  restore(routeKey, context) {}

  /**
   * Scroll to a fragment target element smoothly.
   * Falls back gracefully if element is not found.
   * @param {string} fragment  - Element ID or [data-section] value
   */
  scrollToFragment(fragment) {}

  /**
   * Clear saved snapshot for a given key (e.g. after route is destroyed).
   * @param {string} routeKey
   */
  clear(routeKey) {}
}

/**
 * @typedef {Object} ScrollSnapshot
 * @property {number}                        pageX
 * @property {number}                        pageY
 * @property {Object.<string, {x,y}>}        containers  - selector → {x, y}
 * @property {number}                        savedAt
 */
```

### Restore Decision Table

| Navigation trigger | Has snapshot | Has `#section` fragment | Action |
|---|---|---|---|
| `back` / `forward` | ✅ Yes | — | Restore saved `{x, y}` |
| `back` / `forward` | ❌ No | — | Scroll to top |
| `push` / `replace` | — | ✅ Yes | `scrollToFragment()` |
| `push` / `replace` | — | ❌ No | Scroll to top |

---

## 1.8 — Deep Link Resolver

### Responsibility
Handles externally shared or bookmarked URLs that may be stale, partially valid, or require prerequisite data to load (e.g. `/orders/999` but the user is not logged in, or the order belongs to a different account).

```js
/**
 * @typedef {Object} DeepLinkResolution
 * @property {'resolved'|'redirected'|'failed'} status
 * @property {RouteContext|null}                 context   - Final resolved context
 * @property {string|null}                       redirectTo
 * @property {string|null}                       reason
 */
```

```js
class DeepLinkResolver {
  /**
   * Register a validator for a named route.
   * The validator receives the matched RouteContext and returns whether
   * the link is valid for the current user/session, and optionally a redirect.
   *
   * @param {string}   routeName
   * @param {function(RouteContext): Promise<DeepLinkResolution>} validator
   */
  registerValidator(routeName, validator) {}

  /**
   * Resolve a full URL string into a final navigable RouteContext.
   * Called once on initial page load before first render.
   *
   * @param {string} url  - e.g. 'https://app.example.com/orders/999?tab=items'
   * @returns {Promise<DeepLinkResolution>}
   */
  async resolve(url) {}
}
```

### Resolution Flow

```
App boot → DeepLinkResolver.resolve(window.location.href)
        │
        ├── PathRouter.resolve(pathname)
        │       ├── No match  →  { status: 'failed', redirectTo: 'errors.not-found' }
        │       └── Matched   →  RouteContext
        │
        ├── Run registered validator for matched route name
        │       ├── { status: 'resolved' }   → proceed to render
        │       ├── { status: 'redirected' } → HistoryManager.replace(redirectTo)
        │       └── { status: 'failed' }     → render error outlet
        │
        └── Hand off resolved RouteContext to PathRouter for first render
```

---

## 1.9 — Canonical URL Builder

### Responsibility
Constructs a fully normalized, deterministic URL string from a set of route parameters. Used for sharing, bookmarking, `<link rel="canonical">`, and server-side rendering hydration.

```js
class CanonicalURLBuilder {
  /**
   * Build a full absolute URL for a named route.
   *
   * @param {string}  name              - Route name e.g. 'user.orders'
   * @param {Object}  [params]          - Dynamic path segments
   * @param {Object}  [query]           - Query parameters (will omit defaults)
   * @param {string}  [fragment]        - Fragment without '#'
   * @param {string}  [base]            - Override base URL (default: window.location.origin)
   * @returns {string}                  - e.g. 'https://app.example.com/users/42/orders?status=open'
   */
  build(name, params = {}, query = {}, fragment = '', base) {}

  /**
   * Build only the relative path portion (no origin).
   * @param {string}  name
   * @param {Object}  [params]
   * @param {Object}  [query]
   * @param {string}  [fragment]
   * @returns {string}  - e.g. '/users/42/orders?status=open'
   */
  buildPath(name, params = {}, query = {}, fragment = '') {}

  /**
   * Update the document's <link rel="canonical"> tag.
   * Call on every route change.
   * @param {string} url
   */
  setCanonicalTag(url) {}

  /**
   * Update document.title from route meta or a provided string.
   * Supports template strings e.g. 'Order #{id} — MyApp'
   * @param {RouteContext} context
   * @param {string}       [appName]   - Appended to title e.g. '— MyApp'
   */
  updateDocumentTitle(context, appName = '') {}
}
```

---

## Wiring: Full Bootstrap Sequence

```js
// router/index.js — assembled at boot by the DI Container

const historyManager     = new HistoryManager();
const queryParamManager  = new QueryParamManager();
const fragmentManager    = new FragmentManager();
const guardSystem        = new NavigationGuardSystem();
const transitionManager  = new RouteTransitionManager();
const scrollManager      = new ScrollRestorationManager();
const deepLinkResolver   = new DeepLinkResolver();
const canonicalBuilder   = new CanonicalURLBuilder();
const pathRouter         = new PathRouter();

// 1. Register routes
pathRouter.register(appRoutes);

// 2. Register built-in guards (priority order matters)
guardSystem.addBeforeGuard('auth',           guards.auth(authService),           10);
guardSystem.addBeforeGuard('feature-flag',   guards.featureFlag(flagService),    20);
guardSystem.addBeforeGuard('permission',     guards.permission(permService),     30);
guardSystem.addBeforeGuard('unsaved-changes',guards.unsavedChanges(formReg),    100);
guardSystem.addAfterGuard ('analytics',      guards.analytics(analyticsService), 10);
guardSystem.addAfterGuard ('canonical',      ({ to }) =>                         20
  canonicalBuilder.updateDocumentTitle(to, 'MyApp'));

// 3. Init history (binds popstate)
historyManager.init();
scrollManager.init();   // sets scrollRestoration = 'manual'

// 4. On every history change → run full pipeline
historyManager.onChange(async (entry, trigger) => {
  const { pathname, search, hash } = new URL(entry.path, location.origin);

  const matched = pathRouter.resolve(pathname);
  if (!matched) { /* render 404 */ return; }

  const to = {
    path: pathname,
    params: matched.params,
    query: queryParamManager.parse(search),
    fragment: fragmentManager.parse(hash),
    route: matched.route,
    state: entry.state,
  };
  const from = pathRouter.getCurrentContext();

  // Save scroll before guards (guard may cancel)
  if (from) scrollManager.save(historyManager.getCurrent().key);

  const guardResult = await guardSystem.runBeforeGuards({ from, to, trigger });

  if (!guardResult.proceed) {
    if (guardResult.redirect) historyManager.replace(guardResult.redirect);
    return;
  }

  await transitionManager.transition(from, to);

  scrollManager.restore(entry.key, to);
  queryParamManager.registerSchema(to.route.meta?.querySchema ?? {});
  canonicalBuilder.setCanonicalTag(canonicalBuilder.build(to.route.name, to.params, to.query));

  await guardSystem.runAfterGuards({ from, to, trigger });
});

// 5. Resolve initial deep link on first load
const resolution = await deepLinkResolver.resolve(window.location.href);
if (resolution.status === 'redirected') {
  historyManager.replace(resolution.redirectTo);
} else {
  historyManager.push(window.location.pathname + window.location.search + window.location.hash);
}
```

---

## Event Bus Emissions (Module 5 integration)

| Event name | Payload | When |
|---|---|---|
| `router:navigation:start` | `{ from, to, trigger }` | Before guards run |
| `router:navigation:cancelled` | `{ from, to, reason }` | Guard returned `proceed: false` |
| `router:navigation:redirected` | `{ from, to, redirectTo }` | Guard issued redirect |
| `router:transition:start` | `{ from, to }` | Component loading begins |
| `router:transition:complete` | `{ context }` | New view fully mounted |
| `router:transition:error` | `{ error, context }` | Component load failed |
| `router:query:changed` | `{ prev, next, diff }` | Query params mutated |
| `router:fragment:changed` | `{ namespace, value }` | Fragment namespace changed |

---

## 2. 🗂️ State Management System
A predictable, auditable single source of truth.

- **Global Store** — centralized immutable state tree (Redux-style); pure reducer functions
- **Action Dispatcher** — type-safe action creators with payload validation
- **Middleware Pipeline** — composable middleware for logging, async thunks, analytics, error handling
- **Selector Engine** — memoized derived state computation (like Reselect); prevents redundant re-computation
- **Slice/Module Manager** — lazy-loadable state slices registered at runtime (code splitting friendly)
- **State Diff Engine** — computes minimal diffs between state snapshots for efficient updates and undo/redo
- **Undo/Redo Stack** — command-pattern history for reversible user actions
- **State Persistence Bridge** — syncs specific state slices to storage adapters on change
- **State Hydration Manager** — bootstraps initial state from server-side render, URL, or cached storage
- **Time-Travel Debugger Interface** — (dev only) replay actions against state snapshots

---

## 3. 💾 Storage Manager
Abstracted, multi-backend persistence with a unified API.

- **Storage Adapter Interface** — common contract all adapters implement (`get`, `set`, `delete`, `query`, `clear`)
- **IndexedDB Adapter** — structured, queryable offline storage; handles schema versioning and migrations
- **LocalStorage Adapter** — simple key-value with JSON serialization; size-limit awareness and fallback
- **SessionStorage Adapter** — tab-scoped ephemeral storage
- **In-Memory Adapter** — volatile runtime cache; useful for testing or sensitive data
- **Remote API Adapter** — wraps HTTP endpoints as a storage interface; maps CRUD to REST/GraphQL
- **Cache Adapter** — wraps the Cache API (Service Worker cache) for offline-first assets/responses
- **Storage Router** — routes storage operations to the correct adapter by key namespace or data type
- **Schema Validator** — validates data shape before writes using JSON Schema or custom rules
- **Encryption Layer** — AES-GCM encryption/decryption of sensitive data before it hits any adapter
- **TTL / Expiry Manager** — attaches expiry metadata to entries; lazy-evicts stale records on read
- **Storage Quota Monitor** — monitors available storage; warns or evicts LRU entries before quota errors
- **Migration Engine** — runs versioned, ordered migration scripts on schema changes

---

## 4. 🌐 HTTP Request Manager
A controlled, observable layer over the Fetch API.

- **HTTP Client** — base fetch wrapper with request/response interceptors (like Axios)
- **Request Builder** — fluent API to construct requests (headers, params, body, method)
- **Response Normalizer** — transforms varying API response shapes into a consistent internal format
- **Interceptor Chain** — ordered request/response middleware (auth injection, logging, error mapping)
- **Authentication Interceptor** — injects tokens; handles token refresh transparently on 401
- **Retry Manager** — exponential backoff with jitter; configurable per-request retry policies
- **Timeout Manager** — per-request and global timeout enforcement with `AbortController`
- **Request Deduplicator** — collapses in-flight identical requests into a single network call
- **Request Queue** — serializes requests when offline or rate-limited; flushes on reconnect
- **Rate Limiter** — client-side throttling to respect API rate limits
- **Cache Layer** — short-lived in-memory response cache with configurable TTL per endpoint
- **Batch Request Manager** — combines multiple requests into a single batched API call
- **Progress Tracker** — upload/download progress events for file transfers
- **Error Classifier** — maps HTTP errors to typed domain errors (network, auth, validation, server)
- **Mock Adapter** — intercepts requests in dev/test and returns fixture data

---

## 5. 📡 Event System / Event Bus
The nervous system of the event-driven architecture.

- **Event Bus** — central pub/sub broker; decouples emitters from consumers
- **Namespace Manager** — enforces hierarchical event naming (`auth:user:login`, `cart:item:added`)
- **Event Registry** — catalog of all valid event types with payload schemas (prevents typos, enforces contracts)
- **Event Emitter** — dispatches events synchronously or asynchronously to subscribers
- **Event Subscriber Manager** — manages subscriptions with automatic cleanup on component/module teardown
- **Wildcard Subscriber** — pattern-matched subscriptions (`cart:*`, `*.error`)
- **Event Priority Queue** — ordered event delivery for time-critical sequences
- **Event Replay Buffer** — stores recent events so late subscribers can catch up (useful on module lazy-load)
- **Cross-Tab Event Sync** — broadcasts events across browser tabs via `BroadcastChannel` or `SharedWorker`
- **Event Logger / Audit Trail** — immutable append-only log of all events with timestamps and payloads
- **Dead Letter Queue** — captures unhandled or failed events for inspection and retry
- **Event Transformer Pipeline** — transforms/enriches event payloads before delivery
- **Custom DOM Event Bridge** — bidirectional bridge between native DOM events and the internal bus

---

## 6. 🔐 Authentication & Authorization System

- **Auth Manager** — orchestrates login, logout, session lifecycle
- **Token Store** — secure storage for access/refresh tokens (memory-first, never localStorage for JWTs)
- **Token Refresh Orchestrator** — proactively refreshes tokens before expiry; prevents race conditions
- **Session Manager** — tracks session validity, idle timeout, and forced logout
- **Permission Registry** — maps roles/permissions to capabilities; loaded at login
- **Authorization Guard** — checks permissions before route access, action dispatch, or UI rendering
- **RBAC / ABAC Engine** — role-based or attribute-based access control evaluation
- **Multi-Tenant Context** — manages org/workspace context when multiple tenants share one app
- **SSO Adapter** — integrates SAML, OAuth2, OIDC flows (redirect, popup, silent refresh)
- **CSRF Token Manager** — injects and rotates CSRF tokens on mutating requests
- **Audit Logger** — records auth events (login, logout, permission denial) for compliance

---

## 7. 🖼️ UI Component System

- **Component Base Class** — lifecycle hooks (mount, update, unmount), template rendering, event cleanup
- **Template Engine** — tagged template literals or a lightweight virtual DOM diffing engine
- **Component Registry** — central registry of all defined components; supports dynamic/lazy registration
- **Custom Elements Manager** — wraps Web Components / Custom Elements API for encapsulation
- **Shadow DOM Manager** — scoped styling via Shadow DOM when full encapsulation is needed
- **Slot System** — content projection / transclusion for composable component trees
- **Component Lazy Loader** — dynamically imports component modules on first use
- **Theme Manager** — CSS custom property-based theming; dark/light mode; runtime theme switching
- **Responsive Layout Manager** — breakpoint detection; layout recalculation on resize (using ResizeObserver)
- **Accessibility Manager (a11y)** — ARIA attribute management, focus trapping, live regions, keyboard navigation
- **Animation Controller** — choreographs CSS/JS animations with the Web Animations API; respects `prefers-reduced-motion`
- **Drag and Drop Manager** — pointer-event-based DnD with touch support and drop zone registration

---

## 8. 📋 Form Management System

- **Form Controller** — tracks form state (values, dirty, touched, pristine, submitting)
- **Validation Engine** — sync/async per-field and cross-field validation with composable rules
- **Validation Schema Registry** — reusable schemas (e.g., email, phone, password strength)
- **Field Mask Manager** — input masking for dates, phones, credit cards
- **Form Serializer/Deserializer** — converts form state to/from API payloads
- **Auto-Save Manager** — debounced save of form state to storage; recovers unsaved drafts on reload
- **Multi-Step Form Orchestrator** — manages step state, validation gates, and back/forward navigation
- **File Upload Manager** — chunked uploads, progress tracking, retry, drag-and-drop
- **Form Diff Engine** — compares initial vs current values to detect changes (for "unsaved changes" warnings)

---

## 9. 🔔 Notification & Feedback System

- **Toast / Snackbar Manager** — queued, dismissible, auto-expiring in-app notifications
- **Modal Manager** — controls modal stack (open, close, stacking order, backdrop); integrates with fragment router
- **Dialog Orchestrator** — confirm/alert/prompt dialogs with promise-based resolution
- **Banner/Alert Manager** — persistent page-level alerts (system status, degraded mode)
- **Web Push Manager** — subscribes to push notifications; handles permission requests and payloads
- **Notification Center** — persistent in-app notification inbox with read/unread state
- **Progress Indicator Manager** — global and local loading spinners, skeleton screens, progress bars

---

## 10. 📊 Data Layer / API Integration

- **Repository Pattern Layer** — domain-specific data access objects (UserRepository, OrderRepository) abstracting raw HTTP calls
- **Query Manager** — manages data-fetching lifecycles (loading, success, error, stale, refetch) — similar to React Query
- **Optimistic Update Manager** — applies UI changes immediately; rolls back on failure
- **Data Normalizer** — normalizes nested API responses into flat, ID-indexed collections (like Normalizr)
- **Pagination Manager** — handles offset, cursor, and page-based pagination; manages page cache
- **Infinite Scroll Manager** — intersection-observer-based load-more triggering
- **WebSocket Manager** — connection lifecycle, heartbeat/ping, reconnect with backoff, message framing
- **Server-Sent Events (SSE) Manager** — manages SSE connections for server-push streams
- **GraphQL Client** — query/mutation/subscription execution, fragment management, normalized cache

---

## 11. ⚙️ Background Processing

- **Service Worker Manager** — registration, update lifecycle, message passing to/from SW
- **Background Sync Manager** — queues failed mutations for replay when connectivity restores
- **Web Worker Pool** — manages a pool of workers for CPU-intensive tasks off the main thread
- **Shared Worker Manager** — coordinates shared state or connections across multiple tabs
- **Task Scheduler** — priority queue for deferred tasks executed during idle time (`requestIdleCallback`)
- **Cron/Interval Job Manager** — manages recurring background jobs (token refresh, data polling, cache pruning)

---

## 12. 🧰 Utility Library

- **Function Utilities** — `debounce`, `throttle`, `memoize`, `once`, `pipe`, `compose`, `curry`
- **UUID Manager** — v4 UUID generation, v5 deterministic UUID, UUID validation and parsing
- **Date/Time Utilities** — parsing, formatting, timezone handling, relative time (without bloat of moment.js)
- **Deep Clone / Merge** — deep clone objects; recursive merge with conflict resolution strategies
- **Deep Equal** — structural equality comparison for objects and arrays
- **Type Checker** — runtime type detection (`isString`, `isPlainObject`, `isPromise`, etc.)
- **String Utilities** — slugify, truncate, interpolate, sanitize HTML, escape/unescape
- **Number Utilities** — format currency, percentages, significant figures, byte sizes
- **Array Utilities** — chunk, flatten, groupBy, unique, diff, intersection, sortBy
- **Object Utilities** — pick, omit, keyBy, mapValues, freeze (deep), path accessor (`get(obj, 'a.b.c')`)
- **Color Utilities** — hex/RGB/HSL conversion, luminance, contrast ratio (a11y compliance)
- **Polyfill Manager** — detects and loads polyfills conditionally based on browser capability

---

## 13. 🔍 Search & Filtering

- **Client-Side Search Engine** — full-text index using inverted index or trie; supports fuzzy matching
- **Filter Engine** — composable, chainable filter predicates applied to data collections
- **Sort Manager** — multi-field, multi-direction sort with custom comparators
- **Faceted Search Manager** — aggregates counts per filter option from current result set
- **Search History Manager** — persists recent searches; autocomplete from history

---

## 14. 📈 Observability & Telemetry

- **Logger** — leveled (`debug`, `info`, `warn`, `error`), namespaced, with remote transport in production
- **Error Boundary / Global Error Handler** — catches unhandled errors and promise rejections; prevents silent failures
- **Error Reporter** — batches and ships errors to remote services (Sentry-style) with context enrichment
- **Performance Monitor** — tracks Core Web Vitals, route transition times, API latency using `PerformanceObserver`
- **Analytics Tracker** — generic event tracking abstracted over any analytics backend (GA, Mixpanel, Amplitude)
- **Feature Flag Manager** — runtime feature toggles; integrates with remote flag services
- **A/B Test Manager** — variant assignment, exposure logging, and consistent bucketing per user
- **Session Recorder Interface** — integration point for tools like FullStory, LogRocket
- **Health Check Monitor** — periodic self-diagnostics (storage availability, network, API reachability)

---

## 15. 🌍 Internationalization & Localization (i18n / l10n)

- **Translation Manager** — loads locale bundles lazily; falls back through locale chain
- **Interpolation Engine** — handles variable substitution and pluralization in translation strings
- **Date/Number/Currency Localizer** — wraps `Intl.*` APIs with app-level configuration
- **RTL Layout Manager** — dynamically switches layout direction and mirrors icons/components
- **Locale Detector** — infers locale from browser, URL, user preference, or stored setting

---

## 16. 🏗️ Application Bootstrap & Module System

- **Application Kernel / Core** — initializes all subsystems in dependency order; provides the DI container
- **Dependency Injection Container** — registers and resolves services/singletons; supports factory and scoped lifetimes
- **Plugin System** — allow third-party or internal modules to hook into the app lifecycle via well-defined extension points
- **Module Loader** — dynamic `import()` orchestration with retry and timeout
- **Configuration Manager** — loads and merges environment-specific config; validates schema at boot
- **Environment Adapter** — abstracts `window`, `document`, `navigator` for testability (and SSR)
- **Boot Sequence Manager** — ordered async boot steps with dependency graph resolution; handles boot failures gracefully

---

## 17. 🔒 Security Layer

- **Content Security Policy (CSP) Manager** — nonce injection for inline scripts; reports violations
- **XSS Sanitizer** — sanitizes untrusted HTML before DOM insertion (`DOMPurify`-style)
- **Input Sanitizer** — strips or escapes dangerous input before processing or storage
- **Sensitive Data Scrubber** — removes PII/secrets from logs, error reports, and analytics payloads
- **Subresource Integrity (SRI) Manager** — verifies integrity of dynamically loaded scripts/styles
- **Clickjacking Guard** — enforces `X-Frame-Options` behavior client-side as a secondary layer
- **Secure Communication Channel** — enforces HTTPS, detects downgrade attacks

---

## 18. 🗃️ HTTP Cache Layer

A transparent, request-level caching layer that sits between the HTTP Request Manager and the network, intercepting outgoing requests and serving responses from LocalStorage when valid cached data exists.

---

### Core Design Principles
- **Transparent interception** — the rest of the app makes HTTP calls normally; caching is invisible
- **Path-based configuration** — cache rules are defined per URL pattern, not per call site
- **Cache-first or network-first** — configurable strategy per endpoint
- **Stale-While-Revalidate support** — serve stale data immediately, refresh in background
- **Opt-in by default** — caching must be explicitly configured for a path; nothing is cached silently

---

### Components

**Cache Interceptor**
Hooks into the HTTP Client's interceptor chain (Module 4). Runs before every outgoing request. Checks if the request path matches any configured cache rule. If matched and a valid cache entry exists, short-circuits the network call entirely and returns the cached response. If the entry is stale but `staleWhileRevalidate` is enabled, returns stale data immediately and dispatches a background refresh.

**Cache Configuration Registry**
A declarative map of URL patterns to cache policies. Each entry specifies:
- `pattern` — string, glob, or RegExp matching the request path (e.g., `/api/products*`)
- `methods` — which HTTP methods are cacheable (almost always `GET` only)
- `ttl` — time-to-live in milliseconds before the entry is considered stale
- `strategy` — `cache-first`, `network-first`, or `stale-while-revalidate`
- `vary` — list of query params that form part of the cache key (e.g., `['page', 'filter']`)
- `tags` — logical group labels used for bulk invalidation (e.g., `'products'`, `'user-profile'`)
- `enabled` — boolean or function `(request) => boolean` for conditional caching

```js
CacheRegistry.register([
  {
    pattern: '/api/products*',
    methods: ['GET'],
    ttl: 5 * 60 * 1000,           // 5 minutes
    strategy: 'stale-while-revalidate',
    vary: ['category', 'page'],
    tags: ['products'],
    enabled: true
  },
  {
    pattern: '/api/user/profile',
    methods: ['GET'],
    ttl: 10 * 60 * 1000,          // 10 minutes
    strategy: 'cache-first',
    tags: ['user'],
    enabled: (req) => req.headers['x-no-cache'] !== 'true'
  }
]);
```

**Cache Key Builder**
Constructs a deterministic, collision-safe string key for each request. The key is derived from: the normalized URL path, the sorted and filtered query parameters (only those listed in `vary`), and optionally a tenant or user-scope prefix (for multi-user environments on shared storage). Keys are hashed to keep LocalStorage key lengths manageable and to avoid special character issues.

```
cache::v1::user_123::/api/products::category=shoes&page=2
  → SHA-256 → "cache::a3f9c2..."
```

**Cache Store (LocalStorage Adapter)**
Wraps the LocalStorage adapter from Module 3 with cache-specific read/write semantics. Each stored entry is a serialized envelope:

```js
{
  key: "cache::a3f9c2...",
  url: "/api/products?category=shoes&page=2",
  response: { status: 200, headers: {}, body: { ... } },
  cachedAt: 1710234000000,
  expiresAt: 1710234300000,
  etag: '"abc123"',
  lastModified: "Thu, 12 Mar 2026 10:00:00 GMT",
  tags: ['products'],
  version: 1
}
```

**Cache Validator**
Determines the validity state of a cached entry at read time:
- `FRESH` — within TTL, serve immediately with no network call
- `STALE` — past TTL but entry exists; behaviour depends on configured strategy
- `MISS` — no entry found; always go to network
- `EXPIRED` — entry found but forcibly invalidated; treat as MISS

Also handles HTTP conditional request headers: if an entry carries an `ETag` or `Last-Modified`, the validator injects `If-None-Match` / `If-Modified-Since` headers on the revalidation request and processes `304 Not Modified` responses by refreshing the TTL without re-writing the body.

**Cache Strategy Executor**
Executes the fetch logic for each strategy:

- **`cache-first`** — return cache if FRESH or STALE; only hit network on MISS or EXPIRED. Best for rarely-changing reference data.
- **`network-first`** — always attempt network; fall back to cache on network failure. Best for data that must be current but needs offline resilience.
- **`stale-while-revalidate`** — return STALE entry immediately for zero perceived latency, then fire a background network request and silently update the cache. Emits a `cache:revalidated` event on the Event Bus when fresh data arrives so the UI can decide whether to re-render.

**Cache Invalidation Manager**
Provides fine-grained invalidation APIs called by the application after mutations:

```js
// Invalidate a single exact entry
CacheInvalidator.invalidateKey('/api/products?category=shoes&page=2');

// Invalidate all entries matching a tag
CacheInvalidator.invalidateByTag('products');

// Invalidate all entries matching a pattern
CacheInvalidator.invalidateByPattern('/api/products*');

// Full cache wipe
CacheInvalidator.flush();
```

The HTTP Client's response interceptor automatically calls invalidation after successful `POST`, `PUT`, `PATCH`, and `DELETE` responses based on a configurable `invalidatesTag` mapping declared alongside the cache config. This keeps cache coherence without manual invalidation at every call site.

**Cache Quota Guard**
LocalStorage has a hard browser limit (~5MB). The guard monitors total cache storage usage after every write. If usage exceeds a configurable high-water mark (e.g., 80% of allocated budget), it evicts the least-recently-used entries until usage drops below a low-water mark. Emits a `cache:quota-warning` event when approaching limits.

**Cache Metrics Collector**
Tracks hit/miss/stale/revalidation counters per URL pattern. Integrates with Module 14 (Observability) — exposes metrics to the Performance Monitor and Logger so engineers can tune TTLs and identify over- or under-caching in production.

**Cache Bypass Mechanism**
Provides explicit escape hatches:
- Per-request opt-out via a request option flag `{ cache: false }` or a custom header `X-No-Cache: true`
- Global bypass toggle via Feature Flag Manager (Module 14) — useful to disable caching in a production incident without a deployment
- User-initiated cache clear (e.g., "refresh" button triggers `CacheInvalidator.flush()`)

**Cache Version Manager**
Stores a global cache schema version in LocalStorage. On application boot, compares the stored version against the current app version. If they differ (e.g., after a deployment that changed API response shapes), the entire cache is flushed before any requests are made — preventing the app from serving structurally stale or incompatible data.

---

### Data Flow Diagram

```
HTTP Client (Module 4)
        │
        ▼
  Cache Interceptor  ──── Cache Config Registry
        │                   (pattern match)
        │
   ┌────┴──────────┐
   │               │
  HIT             MISS
   │               │
Cache Validator   Network Request
   │               │
 FRESH  STALE     Response
   │      │    Interceptor
   │      │        │
   │   Strategy    ├── Write to Cache Store
   │   Executor    │       │
   │      │        │   Cache Key Builder
   │  ┌───┴──┐     │   Cache Quota Guard
   │  │      │     │
Return  Return  Return
Cached  Stale + (fresh)
       Background
       Revalidate
           │
     cache:revalidated
       (Event Bus)
```

---

---

## 🗺️ Updated Full Architecture Map

```
╔══════════════════════════════════════════════════════════════════════╗
║                    APPLICATION BOOTSTRAP (16)                        ║
║         Kernel · DI Container · Config Manager · Module Loader       ║
║              Boot Sequence Manager · Environment Adapter             ║
╚══════════════════════════════════════════════════════════════════════╝
                               │
          ┌────────────────────┼─────────────────────┐
          ▼                    ▼                      ▼
╔══════════════════╗  ╔════════════════════╗  ╔══════════════════════╗
║   ROUTER (1)     ║  ║  STATE MANAGER (2) ║  ║  EVENT BUS (5)       ║
║ Path Router      ║  ║  Global Store      ║  ║  Namespace Manager   ║
║ Query Params     ║  ║  Action Dispatcher ║  ║  Event Registry      ║
║ Fragment Mgr     ║  ║  Middleware        ║  ║  Replay Buffer       ║
║ Nav Guards       ║  ║  Selector Engine   ║  ║  Cross-Tab Sync      ║
║ History Mgr      ║  ║  Slice Manager     ║  ║  Dead Letter Queue   ║
║ Scroll Restore   ║  ║  Undo/Redo Stack   ║  ║  Audit Trail         ║
╚════════╤═════════╝  ╚═════════╤══════════╝  ╚══════════╤═══════════╝
         │                      │                         │
         └────────────┬─────────┘                         │
                      ▼                                    │
╔══════════════════════════════════════════════════════════╪═══════════╗
║                        UI LAYER                          │           ║
║  ┌─────────────────────┐   ┌──────────────────────┐     │           ║
║  │ UI COMPONENT SYS (7)│   │  FORM MANAGER (8)    │     │           ║
║  │ Component Registry  │   │  Form Controller     │◄────┘           ║
║  │ Template Engine     │   │  Validation Engine   │                 ║
║  │ Theme Manager       │   │  Auto-Save Manager   │                 ║
║  │ a11y Manager        │   │  File Upload Mgr     │                 ║
║  │ Animation Ctrl      │   └──────────────────────┘                 ║
║  └─────────────────────┘                                             ║
║  ┌─────────────────────┐   ┌──────────────────────┐                 ║
║  │NOTIFICATION SYS (9) │   │  i18n / l10n (15)    │                 ║
║  │ Toast Manager       │   │  Translation Mgr     │                 ║
║  │ Modal Manager       │   │  Interpolation Eng   │                 ║
║  │ Web Push Manager    │   │  RTL Layout Mgr      │                 ║
║  └─────────────────────┘   └──────────────────────┘                 ║
╚══════════════════════════════════════════════════════════════════════╝
                               │
          ┌────────────────────┼──────────────────────┐
          ▼                    ▼                       ▼
╔═══════════════════╗  ╔═══════════════════╗  ╔═══════════════════════╗
║  DATA LAYER (10)  ║  ║  SEARCH &         ║  ║  AUTH & AUTHZ (6)     ║
║  Repository Layer ║  ║  FILTERING (13)   ║  ║  Auth Manager         ║
║  Query Manager    ║  ║  Search Engine    ║  ║  Token Store          ║
║  Optimistic Upd.  ║  ║  Filter Engine    ║  ║  Permission Registry  ║
║  Data Normalizer  ║  ║  Faceted Search   ║  ║  RBAC/ABAC Engine     ║
║  Pagination Mgr   ║  ╚═══════════════════╝  ║  SSO Adapter          ║
║  WebSocket Mgr    ║                          ╚═══════════════════════╝
║  SSE Manager      ║
╚════════╤══════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  HTTP REQUEST MANAGER (4)                            ║
║    HTTP Client · Request Builder · Interceptor Chain                 ║
║    Auth Interceptor · Retry Manager · Deduplicator                   ║
║    Batch Manager · Error Classifier · Mock Adapter                   ║
╚══════════════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  HTTP CACHE LAYER (18)                               ║
║                                                                      ║
║  ┌─────────────────┐      ┌──────────────────────┐                   ║
║  │ Cache Intercept │─────►│ Cache Config Registry │                  ║
║  └────────┬────────┘      │ (pattern · ttl ·      │                  ║
║           │               │  strategy · tags)     │                  ║
║      ┌────┴────┐          └──────────────────────┘                   ║
║     HIT      MISS                                                    ║
║      │         └──────────────────────► NETWORK                      ║
║      ▼                                     │                         ║
║  Cache Validator                     Response writes                 ║
║  (FRESH·STALE·MISS)                  back to store                   ║
║      │                                     │                         ║
║  Strategy Executor ◄────────────────────── ┘                         ║
║  cache-first │ network-first │ stale-while-revalidate                ║
║      │                                                               ║
║  Cache Store (LocalStorage) ◄── Cache Key Builder                    ║
║      │                                                               ║
║  Cache Quota Guard · Invalidation Manager · Version Manager          ║
║  Cache Metrics Collector ──────────────────────► Event Bus (5)       ║
╚══════════════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════════════╗
║                    STORAGE MANAGER (3)                               ║
║                                                                      ║
║   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐               ║
║   │  IndexedDB  │  │ LocalStorage │  │ SessionStorage│               ║
║   │  Adapter    │  │   Adapter    │  │   Adapter     │               ║
║   └─────────────┘  └──────────────┘  └───────────────┘               ║
║   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐               ║
║   │  In-Memory  │  │ Remote API   │  │  Cache API    │               ║
║   │  Adapter    │  │   Adapter    │  │   Adapter     │               ║
║   └─────────────┘  └──────────────┘  └───────────────┘               ║
║   Storage Router · Schema Validator · Encryption Layer               ║
║   TTL Manager · Quota Monitor · Migration Engine                     ║
╚══════════════════════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════════════════════╗
║               BACKGROUND PROCESSING (11)                             ║
║  Service Worker · Background Sync · Web Worker Pool                  ║
║  Shared Worker · Task Scheduler · Cron/Interval Jobs                 ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                 CROSS-CUTTING CONCERNS                               ║
║                                                                      ║
║  ┌─────────────────────────────┐  ┌──────────────────────────────┐   ║
║  │  OBSERVABILITY (14)         │  │  SECURITY LAYER (17)         │   ║
║  │  Logger · Error Boundary    │  │  XSS Sanitizer               │   ║
║  │  Error Reporter             │  │  Input Sanitizer             │   ║
║  │  Performance Monitor        │  │  CSRF Token Manager          │   ║
║  │  Analytics Tracker          │  │  Sensitive Data Scrubber     │   ║
║  │  Feature Flag Manager       │  │  CSP Manager · SRI Manager   │   ║
║  │  A/B Test Manager           │  └──────────────────────────────┘   ║
║  │  Health Check Monitor       │  ┌──────────────────────────────┐   ║
║  └─────────────────────────────┘  │  UTILITY LIBRARY (12)        │   ║
║                                   │  debounce · throttle         │   ║
║                                   │  UUID · deep clone/equal     │   ║
║                                   │  Date · String · Array utils │   ║
║                                   │  Type checker · Polyfills    │   ║
║                                   └──────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              REQUEST FLOW SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  UI / Data Layer
      │  fires request
      ▼
  HTTP Request Manager (4)
      │  interceptor chain
      ▼
  HTTP Cache Layer (18)  ──── FRESH HIT? ──► return cached response
      │  MISS / STALE                              │
      ▼                                       (stale-while-revalidate
  Network (fetch)                              returns stale here too)
      │
      ▼
  Response Interceptor
      ├── normalize (Module 4)
      ├── write to Cache Store (18) ◄── LocalStorage Adapter (3)
      ├── invalidate related tags (18)
      └── return to caller
```

---

The HTTP Cache Layer (18) is deliberately positioned **between the HTTP Request Manager and the network** — it is the last interceptor before a request escapes the browser, and the first writer after a response arrives. It has **no knowledge of the UI or State Manager**, communicates side-effects exclusively via the **Event Bus** (e.g., `cache:revalidated`, `cache:quota-warning`, `cache:flushed`), and is fully configurable through the **Config Manager** at boot time.

---

## Summary Architecture Map
Bootstrap/Kernel (16)
    ├── DI Container
    ├── Config Manager
    ├── Module Loader
    ├── Boot Sequence Manager
    └── Environment Adapter
            │
    ┌───────┼───────────────────────────────────┐
    │       │                                   │
    │       │                                   │
  Router  State Manager (2)              Event Bus (5)
  (1)     ├── Global Store               ├── Namespace Manager
    │     ├── Action Dispatcher          ├── Event Registry
    │     ├── Middleware Pipeline        ├── Replay Buffer
    │     ├── Selector Engine            ├── Cross-Tab Sync
    │     ├── Slice Manager              ├── Dead Letter Queue
    │     └── Undo/Redo Stack            └── Audit Trail
    │
  ├── Path Router
  ├── Query Param Manager
  ├── Fragment Manager
  ├── Navigation Guards
  ├── History Manager
  ├── Scroll Restoration
  └── Deep Link Resolver
            │
            │◄──────────────── Auth & Authorization (6)
            │                   ├── Auth Manager
            │                   ├── Token Store
            │                   ├── Token Refresh Orchestrator
            │                   ├── Permission Registry
            │                   ├── RBAC / ABAC Engine
            │                   ├── Multi-Tenant Context
            │                   └── SSO Adapter
            │
    ┌───────┴──────────────────────┐
    │                              │
  UI Layer                  i18n / l10n (15)
    │                         ├── Translation Manager
    │                         ├── Interpolation Engine
    │                         ├── Date/Number Localizer
    │                         ├── RTL Layout Manager
    │                         └── Locale Detector
    │
  ├── Component System (7)
  │     ├── Component Base Class
  │     ├── Template Engine
  │     ├── Component Registry
  │     ├── Custom Elements Manager
  │     ├── Theme Manager
  │     ├── Responsive Layout Manager
  │     ├── Accessibility Manager
  │     ├── Animation Controller
  │     └── Drag and Drop Manager
  │
  ├── Form Manager (8)
  │     ├── Form Controller
  │     ├── Validation Engine
  │     ├── Field Mask Manager
  │     ├── Auto-Save Manager
  │     ├── Multi-Step Orchestrator
  │     ├── File Upload Manager
  │     └── Form Diff Engine
  │
  ├── Notification System (9)
  │     ├── Toast / Snackbar Manager
  │     ├── Modal Manager
  │     ├── Dialog Orchestrator
  │     ├── Banner / Alert Manager
  │     ├── Web Push Manager
  │     └── Notification Center
  │
  └── Search & Filtering (13)
        ├── Client-Side Search Engine
        ├── Filter Engine
        ├── Sort Manager
        ├── Faceted Search Manager
        └── Search History Manager
            │
            │
      Data Layer (10)
        ├── Repository Layer
        ├── Query Manager
        ├── Optimistic Update Manager
        ├── Data Normalizer
        ├── Pagination Manager
        ├── Infinite Scroll Manager
        ├── WebSocket Manager
        ├── SSE Manager
        └── GraphQL Client
            │
            │
      HTTP Request Manager (4)
        ├── HTTP Client
        ├── Request Builder
        ├── Interceptor Chain
        ├── Auth Interceptor
        ├── Retry Manager
        ├── Timeout Manager
        ├── Request Deduplicator
        ├── Request Queue
        ├── Rate Limiter
        ├── Batch Request Manager
        ├── Progress Tracker
        ├── Error Classifier
        └── Mock Adapter
            │
            │
      HTTP Cache Layer (18) ◄──────────────────── NEW
        ├── Cache Interceptor
        ├── Cache Config Registry
        │     ├── URL Pattern Matching
        │     ├── TTL Rules
        │     ├── Strategy per Endpoint
        │     └── Tag Definitions
        ├── Cache Key Builder
        ├── Cache Validator
        │     ├── FRESH
        │     ├── STALE
        │     ├── MISS
        │     └── EXPIRED
        ├── Cache Strategy Executor
        │     ├── cache-first
        │     ├── network-first
        │     └── stale-while-revalidate
        ├── Cache Invalidation Manager
        │     ├── invalidateKey()
        │     ├── invalidateByTag()
        │     ├── invalidateByPattern()
        │     └── flush()
        ├── Cache Quota Guard
        ├── Cache Version Manager
        ├── Cache Bypass Mechanism
        └── Cache Metrics Collector
            │                   │
            │                   └──────────────► Event Bus (5)
            │                                    cache:revalidated
            │                                    cache:quota-warning
            │                                    cache:flushed
            │
            │
      Storage Manager (3)
        ├── Storage Router
        ├── Schema Validator
        ├── Encryption Layer
        ├── TTL / Expiry Manager
        ├── Quota Monitor
        ├── Migration Engine
        │
        ├── IndexedDB Adapter
        ├── LocalStorage Adapter  ◄──── used by HTTP Cache Layer (18)
        ├── SessionStorage Adapter
        ├── In-Memory Adapter
        ├── Remote API Adapter
        └── Cache API Adapter
            │
            │
      Background Processing (11)
        ├── Service Worker Manager
        ├── Background Sync Manager
        ├── Web Worker Pool
        ├── Shared Worker Manager
        ├── Task Scheduler
        └── Cron / Interval Job Manager


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         CROSS-CUTTING CONCERNS
         (wired into every layer via DI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Observability (14)                 Security Layer (17)
    ├── Logger                         ├── XSS Sanitizer
    ├── Error Boundary                 ├── Input Sanitizer
    ├── Error Reporter                 ├── CSRF Token Manager
    ├── Performance Monitor            ├── Sensitive Data Scrubber
    ├── Analytics Tracker              ├── CSP Manager
    ├── Feature Flag Manager           ├── SRI Manager
    ├── A/B Test Manager               └── Clickjacking Guard
    ├── Session Recorder Interface
    └── Health Check Monitor

  Utility Library (12)
    ├── debounce · throttle · memoize · once · pipe · compose
    ├── UUID (generate · validate · v4 · v5)
    ├── Deep Clone · Deep Merge · Deep Equal
    ├── Date / Time Utilities
    ├── String · Number · Array · Object · Color Utilities
    ├── Type Checker
    └── Polyfill Manager


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              REQUEST FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  UI / Data Layer
      │
      ▼
  HTTP Request Manager (4)
  [interceptor chain runs]
      │
      ▼
  HTTP Cache Layer (18)
      │
      ├── FRESH HIT ──────────────────────────────► return immediately
      │
      ├── STALE + stale-while-revalidate ──────────► return stale now
      │                                              + revalidate async
      │                                              + emit cache:revalidated
      │
      └── MISS / EXPIRED
              │
              ▼
          Network (fetch)
              │
              ▼
          Response
              ├── normalize            (Module 4)
              ├── write to LocalStorage (Module 18 → Module 3)
              ├── invalidate tags      (Module 18)
              ├── update metrics       (Module 18 → Module 14)
              └── return to caller

---

Each of these is a **standalone, testable module** with a published interface — communicating either through the **Event Bus** (loose coupling) or **direct injection** (tight coupling where latency or sequencing matters). The key architectural discipline is that **no module imports another directly unless it is a declared dependency** — everything else is mediated through events or the DI container.