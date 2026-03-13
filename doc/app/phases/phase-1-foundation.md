# Phase 1 — Foundation and Infrastructure Setup

**Duration:** 1–2 months  
**Depends on:** CRM API specification (even a mock schema is sufficient to begin)  
**Unlocks:** Phase 2 (Core Call Workflow)

---

## Objectives

Establish the structural backbone of the system so all subsequent phases build on a stable, well-tested foundation — not a prototype. This phase produces no user-visible features but creates every interface, data model, and engineering practice the rest of the system depends on.

The backend foundation in this phase is explicitly built on NestJS, using Nest modules, providers, and controllers as the primary application structure.

---

## Directory and Project Structure

```
lead-recovery/
├── backend/
│   ├── src/
│   │   ├── app.module.ts            # Root NestJS application module
│   │   ├── main.ts                  # NestJS bootstrap entry point
│   │   ├── common/
│   │   │   ├── interfaces/          # WorkflowModule, CRMAdapter, etc.
│   │   │   ├── models/              # Domain models (Customer, Funnel, Conversation …)
│   │   │   ├── registry/            # Module registry + DI helpers
│   │   │   ├── config/              # Config loader, schema, env-override
│   │   │   └── logger/              # Structured logger with correlation IDs
│   │   ├── modules/
│   │   │   ├── customer-data-retrieval/
│   │   │   │   ├── customer-data-retrieval.module.ts
│   │   │   │   └── customer-data-retrieval.service.ts
│   │   │   └── customer-context-acquisition/
│   │   │       ├── customer-context-acquisition.module.ts
│   │   │       └── customer-context-acquisition.service.ts
│   │   ├── adapters/
│   │   │   └── crm/
│   │   │       ├── crm-adapter.interface.ts
│   │   │       └── mock-crm-adapter.ts
│   │   └── health/
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── fixtures/
│   ├── config/
│   │   ├── default.yaml
│   │   └── test.yaml
│   ├── package.json
│   └── tsconfig.json
├── frontend/                        # Placeholder — populated in Phase 5
├── infra/
│   ├── docker-compose.yml
│   └── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── lint.yml
└── docs -> ../doc/                  # Symlink for convenience
```

---

## Core Interfaces

### WorkflowModule Interface

Every step in the call workflow, from Phases 1–7, must satisfy this contract:

```typescript
interface ModuleInput  { [key: string]: unknown }
interface ModuleOutput { [key: string]: unknown }

interface WorkflowModule<I extends ModuleInput, O extends ModuleOutput> {
  /** Human-readable identifier, used in logs and config */
  readonly id: string;

  /** Execute the module. Throws WorkflowModuleError on failure. */
  execute(input: I, context: ExecutionContext): Promise<O>;

  /** Validate inputs before execution. Returns list of validation errors. */
  validateInputs(input: I): ValidationError[];

  /**
   * Declares module dependencies so the orchestrator and registry can resolve
   * prerequisites before execution.
   */
  getDependencies(): string[];

  /**
   * Returns true when this module can be merged with the adjacent module
   * at the service level (both steps handled by one API call).
   */
  isFusable(adjacentModuleId: string): boolean;

  /**
   * Returns true when this module can be skipped given current context
   * (e.g., data already cached, step not applicable to this funnel stage).
   */
  canSkip(context: ExecutionContext): boolean;
}
```

This preserves alignment with the core contract described in [conversation.md](../conversation.md) while still allowing stronger typed inputs and outputs per module.

### ExecutionContext

Carries cross-cutting data so modules do not couple to each other:

```typescript
interface ExecutionContext {
  correlationId: string;          // Unique per call session
  customerId: string;
  funnelId: string;
  stageId: string;
  config: ResolvedConfig;
  logger: Logger;
  /** Accumulated outputs from previously executed modules in this run */
  stepOutputs: Map<string, ModuleOutput>;
}
```

### CRMAdapter Interface

Abstracts internal vs. external CRM so Phase 1 can use a mock and Phase 6 swaps in a real adapter:

```typescript
interface CRMAdapter {
  getCustomerById(id: string): Promise<Customer>;
  getLeadsByFunnelStage(funnelId: string, stageId: string): Promise<Lead[]>;
  updateLeadStatus(leadId: string, status: LeadStatus): Promise<void>;
  getCustomerFunnelContext(customerId: string, funnelId: string): Promise<FunnelContext>;
}
```

In NestJS, these adapters are registered as providers and injected into feature services through the framework DI container.

---

## Data Models

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;             // E.164 format, encrypted at rest
  email?: string;
  language: string;          // BCP-47, e.g. "en-IN", "hi-IN"
  createdAt: Date;
  updatedAt: Date;
}
```

### Lead

```typescript
type LeadStatus =
  | 'pending'       // Not yet contacted
  | 'scheduled'     // Call scheduled
  | 'in-call'       // Call in progress
  | 'recovered'     // Redirected back into funnel
  | 'failed'        // Could not recover
  | 'escalated'     // Handed to human
  | 'unreachable';  // No answer / wrong number

interface Lead {
  id: string;
  customerId: string;
  funnelId: string;
  stageId: string;             // Stage where lead dropped off
  dropOffReason?: string;
  status: LeadStatus;
  conversionScore?: number;    // 0–1, populated by scoring module
  scheduledCallAt?: Date;
  lastContactedAt?: Date;
  callAttempts: number;
  metadata: Record<string, unknown>;  // Funnel-specific extra fields
}
```

### Funnel & Stage

```typescript
interface Funnel {
  id: string;
  productId: string;
  title: string;
  description: string;
  stages: Stage[];
  policies: Policy[];
  isActive: boolean;
}

interface Stage {
  id: string;
  funnelId: string;
  title: string;
  goal: string;
  description: string;
  order: number;              // Lower = earlier in funnel
  isParallel: boolean;        // Can run concurrently with other stages
  policies: Policy[];
  systemObjections: Objection[];
  customerObjections: Objection[];
}

interface Objection {
  id: string;
  type: 'system' | 'customer';
  title: string;
  description: string;
  handlingScript?: string;    // Configurable response script
  escalate: boolean;          // Whether to escalate if encountered
}

interface Policy {
  id: string;
  scope: 'funnel' | 'stage' | 'system';
  key: string;
  value: string;
  description: string;
}
```

### FunnelContext

```typescript
interface FunnelContext {
  customerId: string;
  funnelId: string;
  currentStageId: string;
  completedStageIds: string[];
  progressionHistory: ProgressionEvent[];
  anticipatedObjections: Objection[];
}

interface ProgressionEvent {
  stageId: string;
  enteredAt: Date;
  exitedAt?: Date;
  outcome: 'completed' | 'dropped' | 'skipped';
  notes?: string;
}
```

### Conversation & CallSession

```typescript
type CallSessionStatus = 'preparing' | 'initiating' | 'active' | 'completed' | 'failed';

interface CallSession {
  id: string;
  leadId: string;
  customerId: string;
  funnelId: string;
  stageId: string;
  startedAt?: Date;
  endedAt?: Date;
  status: CallSessionStatus;
  durationSeconds?: number;
  transcript: TranscriptEntry[];
  moduleOutputs: Record<string, ModuleOutput>;   // All step results
  assessmentScore?: number;                       // Post-call score
  outcome?: 'recovered' | 'failed' | 'escalated';
}

interface TranscriptEntry {
  timestamp: Date;
  speaker: 'agent' | 'customer';
  text: string;
  audioRef?: string;      // Storage reference for audio clip
}
```

---

## Workflow Modules (Phase 1)

### Module 1 — Customer Data Retrieval

**Purpose:** Fetch the next scheduled lead and its customer profile from the CRM.

**File:** `backend/src/modules/customer-data-retrieval/customer-data-retrieval.module.ts`

```typescript
interface CustomerDataRetrievalInput extends ModuleInput {
  leadId: string;
}

interface CustomerDataRetrievalOutput extends ModuleOutput {
  customer: Customer;
  lead: Lead;
}
```

**Implementation tasks:**
- [ ] Define input/output types
- [ ] Inject `CRMAdapter`; call `getCustomerById` + lead fetch
- [ ] Validate that `lead.status === 'scheduled'` before proceeding
- [ ] `isFusable('customer-context-acquisition')` → `true` (can be combined if CRM provides stage data in one call)
- [ ] `canSkip` → always `false` (cannot proceed without customer data)
- [ ] Implement `MockCRMAdapter` returning fixture data for tests

**Test cases:**
- Returns correct customer and lead for valid `leadId`
- Throws `WorkflowModuleError` for unknown `leadId`
- Throws `WorkflowModuleError` if lead status is not `scheduled`
- Mock adapter returns deterministic fixture data

### Module 2 — Customer Context Acquisition

**Purpose:** Resolve the customer's current funnel position and produce anticipated objections.

**File:** `backend/src/modules/customer-context-acquisition/customer-context-acquisition.module.ts`

```typescript
interface CustomerContextInput extends ModuleInput {
  customerId: string;
  funnelId: string;
}

interface CustomerContextOutput extends ModuleOutput {
  funnelContext: FunnelContext;
}
```

**Implementation tasks:**
- [ ] Call `CRMAdapter.getCustomerFunnelContext`
- [ ] Cross-reference objection database to populate `anticipatedObjections`
- [ ] `isFusable('customer-data-retrieval')` → `true`
- [ ] `canSkip` → `false`
- [ ] Unit test with mock funnel context fixture

---

## Configuration System

### Schema (YAML)

```yaml
# config/default.yaml
app:
  name: lead-recovery
  environment: development
  port: 3000

crm:
  adapter: mock          # mock | internal | salesforce | hubspot
  baseUrl: ""
  timeout: 5000

logging:
  level: info            # debug | info | warn | error
  format: json           # json | pretty
  correlationIdHeader: X-Correlation-ID

scheduling:
  maxCallAttempts: 3
  retryIntervalMinutes: 60

security:
  encryptionKeyEnvVar: ENCRYPTION_KEY
  jwtSecret: ""          # Set via env in production
```

**Implementation tasks:**
- [ ] Config loader that merges `default.yaml`, environment-specific YAML, and `process.env` overrides
- [ ] Validate config against JSON Schema on startup; fail fast if invalid
- [ ] Never log sensitive fields (`encryptionKey`, `jwtSecret`, phone numbers)
- [ ] Export `ResolvedConfig` type for use in `ExecutionContext`

---

## Logging Framework

Requirements aligned with [sys/14 — Observability & Telemetry](../../sys/14-observability_and_telemetry.md):

- Structured JSON output in production, pretty-print in development
- Every log entry includes: `timestamp`, `level`, `correlationId`, `module`, `message`, `durationMs` (where applicable)
- **PII fields** (`phone`, `name`, `email`) are masked automatically via a custom serializer
- Log levels: `debug`, `info`, `warn`, `error`, `fatal`

```typescript
// Usage
logger.info('Customer data retrieved', {
  customerId: 'c_123',
  leadId: 'l_456',
  durationMs: 42,
});
```

**Implementation tasks:**
- [ ] Wrap a structured logger (e.g., `pino`) or implement from scratch with no external deps
- [ ] PII masking serializer (masks `phone`, `email`, `name` field values in log output)
- [ ] Correlation ID propagated via `AsyncLocalStorage` (Node.js)
- [ ] Logger factory: `createLogger(moduleName: string): Logger`

---

## Dependency Injection and Module Registry

```typescript
// Module registration
const registry = new ModuleRegistry();
registry.register('customer-data-retrieval', new CustomerDataRetrievalModule(crmAdapter));
registry.register('customer-context-acquisition', new CustomerContextAcquisitionModule(crmAdapter));

// Retrieval
const module = registry.get<CustomerDataRetrievalModule>('customer-data-retrieval');
```

**Implementation tasks:**
- [ ] `ModuleRegistry` class: `register`, `get`, `getAll`, `has`
- [ ] Support tagging modules (e.g., `workflow`, `utility`) for grouped retrieval
- [ ] Register workflow services and adapters as NestJS providers
- [ ] Use NestJS modules for feature boundaries and constructor injection for dependencies
- [ ] Keep `ModuleRegistry` as an application-level orchestration registry on top of NestJS DI

---

## CI/CD Pipeline

### GitHub Actions: `ci.yml`

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit -- --coverage
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
```

**Implementation tasks:**
- [ ] Configure ESLint with `@typescript-eslint` rules; no `any` allowed
- [ ] Configure Prettier for consistent formatting
- [ ] Set up `jest` (or `vitest`) with path aliases matching `tsconfig`
- [ ] Coverage gate: 80% lines/branches minimum (enforced in CI)
- [ ] Docker Compose file for local development with hot-reload

---

## Testing Strategy

| Test Type | Scope | Tool | Coverage Target |
|-----------|-------|------|-----------------|
| Unit | Each module in isolation with mocks | Jest/Vitest | ≥ 80% |
| Contract | `WorkflowModule` interface compliance | Jest | 100% of modules |
| Config | Config schema validation | Jest | All required fields |
| Logger | PII masking, JSON format | Jest | Masking paths |

**Fixture data:**
- `tests/fixtures/customer.fixture.ts` — standard customer objects
- `tests/fixtures/lead.fixture.ts` — leads in each status
- `tests/fixtures/funnel.fixture.ts` — credit card application funnel from [funnel-definition.md](../funnel-definition.md)

---

## Acceptance Criteria

- [ ] `npm run test:unit` passes with ≥ 80% coverage
- [ ] `npm run lint` and `npm run type-check` produce zero errors
- [ ] Config loaded from `default.yaml` + env overrides; invalid config causes startup failure with clear error
- [ ] All log output is JSON with `correlationId`; phone numbers are masked
- [ ] `CustomerDataRetrievalModule` and `CustomerContextAcquisitionModule` pass all unit tests
- [ ] Module registry resolves registered modules without runtime errors
- [ ] CI pipeline runs on every push; build artifact produced on `main`

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CRM API spec unavailable | Medium | High | Proceed with mock adapter; define interface contract to swap in real adapter later |
| Type-system complexity in generic WorkflowModule | Low | Medium | Keep generics shallow; use discriminated unions over deep inference |
| Over-engineering DI container | Medium | Medium | Use a minimal registry first; adopt a framework (e.g., InversifyJS) only if complexity demands it |

---

## Definition of Done

All acceptance criteria checked, PR reviewed, CI green, and Phase 2 kickoff meeting held with Phase 1 deliverables demonstrated.
