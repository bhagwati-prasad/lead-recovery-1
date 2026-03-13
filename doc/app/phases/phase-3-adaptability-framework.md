# Phase 3 — Adaptability Framework and Orchestration

**Duration:** 1–2 months  
**Depends on:** Phase 2 complete (all 7 workflow modules implemented and integration-tested)  
**Unlocks:** Phase 4 (Advanced Conversation Features)

---

## Objectives

Replace the hard-wired module sequence in Phase 2 with a configurable, composable **Workflow Orchestrator** that can merge steps, skip steps, or hand entire workflow segments to third-party services — all through configuration rather than code changes.

---

## Core Concepts

### Step Fusion

Some third-party services collapse multiple workflow steps into a single API call. The orchestrator must recognise these cases and short-circuit the individual modules.

**Service-Level Fusion** — Two adjacent modules handled by one API call:
- Steps 1+2: CRM returns customer context in the same response as customer data
- Steps 4+5: Telephony provider auto-plays welcome audio on connect
- Steps 6+7: A conversational AI platform handles both response + loop

**Workflow-Level Fusion** — Entire workflow managed externally:
- A third-party outbound call AI handles Steps 4–10 end-to-end (e.g., a SaaS calling agent)

### Skippable Steps

Steps with `canSkip` returning `true` under certain conditions:
- Module 5 (Welcome Message): skip if telephony adapter is fused with pre-recorded greeting
- Module 8 (Exception Handling): skip if LLM has built-in deviation detection
- Module 9 (Assessment): skip if external service provides its own scoring

Module 9 is formally delivered in Phase 4. It is referenced here intentionally so the orchestrator contract and configuration schema are forward-compatible before the assessment module is implemented.

---

## Workflow Orchestrator

**File:** `backend/src/orchestrator/workflow-orchestrator.ts`

### Orchestrator Contract

```typescript
interface OrchestratorConfig {
  workflowId: string;
  steps: StepConfig[];
  fusionRules: FusionRule[];
  globalSkipConditions: SkipCondition[];
  maxRetries: number;
  retryDelayMs: number;
}

interface StepConfig {
  moduleId: string;
  order: number;
  required: boolean;
  skipConditions: SkipCondition[];
  timeoutMs: number;
}

interface FusionRule {
  id: string;
  moduleIds: string[];           // Ordered list of modules to fuse
  adapterType: string;           // e.g. 'twilio', 'sarvam-full', 'elevenlabs-convai'
  fusedAdapterId: string;        // Registry key for the fused adapter
  condition?: string;            // JSONLogic expression; must evaluate to true
}

interface SkipCondition {
  moduleId: string;
  expression: string;            // JSONLogic expression evaluated against ExecutionContext
  defaultOutput?: ModuleOutput;  // Emitted as if the module ran, to satisfy downstream inputs
}
```

### Execution Algorithm

```
BUILD execution plan
  FOR each step in OrchestratorConfig.steps (ordered by .order):
    EVALUATE skipConditions → mark as SKIP or RUN
  APPLY fusion rules:
    FOR each FusionRule where all moduleIds are in RUN set:
      EVALUATE condition
      IF true → replace those steps with a single FusedStep
  VALIDATE plan: required steps are not skipped
  VALIDATE plan: all downstream inputs can be satisfied

EXECUTE plan
  FOR each step/fused-step:
    validateInputs(resolvedInput)
    IF validation fails → throw WorkflowPlanError (fail fast)
    TRY execute with retries
    ON success → store output in context.stepOutputs
    ON failure (after retries) → check step.required
      IF required → abort workflow; emit 'workflow.failed' event
      IF optional → log warning; continue with null output
```

### Input Resolution

Each module declares what keys it needs from `context.stepOutputs`. The orchestrator resolves dependencies automatically:

```typescript
interface ModuleInputMapping {
  moduleId: string;
  inputs: {
    paramName: string;
    sourceModuleId: string;
    sourceKey: string;
    required: boolean;
  }[];
}
```

This makes execution order explicit and catches missing dependencies at plan-build time, not at runtime.

---

## Fused Adapters

### FusedAdapter Interface

```typescript
interface FusedAdapter<I extends ModuleInput, O extends ModuleOutput> {
  readonly id: string;
  readonly fusesModuleIds: string[];       // The modules this adapter replaces
  execute(input: I, context: ExecutionContext): Promise<O>;
}
```

### Built-in Fused Adapters (Phase 3)

#### CRMContextFusedAdapter (Steps 1+2)

```typescript
// Replaces: customer-data-retrieval + customer-context-acquisition
interface CRMContextFusedInput extends ModuleInput {
  leadId: string;
}
interface CRMContextFusedOutput extends ModuleOutput {
  customer: Customer;
  lead: Lead;
  funnelContext: FunnelContext;
}
```

#### TelephonyWelcomeFusedAdapter (Steps 4+5)

```typescript
// Replaces: call-initiation + welcome-message
// Use when telephony provider plays welcome audio automatically on connect
interface TelephonyWelcomeFusedOutput extends ModuleOutput {
  providerCallId: string;
  callSessionId: string;
  welcomeDeliveredAt: Date;
}
```

#### FullConversationalAIAdapter (Steps 4–7)

```typescript
// Replaces: call-initiation + welcome-message + response-processing + conversation-loop
// Use when a SaaS outbound calling AI manages the entire conversation
interface FullConversationalAIInput extends ModuleInput {
  customer: Customer;
  lead: Lead;
  conversationStrategy: ConversationStrategy;
}
interface FullConversationalAIOutput extends ModuleOutput {
  finalTranscript: TranscriptEntry[];
  endReason: ConversationEndReason;
  detectedObjections: Objection[];
  providerSessionId: string;
}
```

**Implementation tasks:**
- [ ] `FullConversationalAIAdapter` abstract base class; concrete implementations in Phase 6
- [ ] Mock implementation returning scripted transcript

---

## Configuration Schema

```yaml
# config/workflows/lead-recovery-call.yaml
workflowId: lead-recovery-call
steps:
  - moduleId: customer-data-retrieval
    order: 1
    required: true
    timeoutMs: 5000
  - moduleId: customer-context-acquisition
    order: 2
    required: true
    timeoutMs: 5000
  - moduleId: call-preparation
    order: 3
    required: true
    timeoutMs: 10000
  - moduleId: call-initiation
    order: 4
    required: true
    timeoutMs: 60000
  - moduleId: welcome-message
    order: 5
    required: true
    timeoutMs: 10000
    skipConditions:
      - expression: '{"==": [{"var": "fusedAdapter"}, "telephony-welcome"]}'
        defaultOutput:
          welcomeAudioRef: "fused:telephony-welcome"
          deliveredAt: null   # Telephony provider handles timing
  - moduleId: response-processing
    order: 6
    required: true
    timeoutMs: 8000
  - moduleId: conversation-loop
    order: 7
    required: true
    timeoutMs: 600000
  - moduleId: exception-handling
    order: 8
    required: false
    timeoutMs: 5000
    skipConditions:
      - expression: '{"==": [{"var": "llm.hasBuiltInDeviation"}, true]}'
  - moduleId: accomplishment-assessment
    order: 9
    required: false
    timeoutMs: 5000
    skipConditions:
      - expression: '{"==": [{"var": "externalAssessment.enabled"}, true]}'
  - moduleId: conversation-logging
    order: 10
    required: true
    timeoutMs: 3000

fusionRules:
  - id: crm-context-fusion
    moduleIds: [customer-data-retrieval, customer-context-acquisition]
    adapterType: crm-context-fused
    fusedAdapterId: crm-context-fused-adapter
    condition: '{"==": [{"var": "config.crm.supportsContextFusion"}, true]}'

  - id: telephony-welcome-fusion
    moduleIds: [call-initiation, welcome-message]
    adapterType: telephony-welcome
    fusedAdapterId: telephony-welcome-fused-adapter
    condition: '{"==": [{"var": "config.telephony.playsWelcomeOnConnect"}, true]}'

  - id: full-conversational-ai
    moduleIds:
      [call-initiation, welcome-message, response-processing, conversation-loop]
    adapterType: full-conversational-ai
    fusedAdapterId: full-conversational-ai-adapter
    condition: '{"==": [{"var": "config.conversationalAi.useFullService"}, true]}'

maxRetries: 2
retryDelayMs: 1000
```

---

## Module 8 — Exception Handling and Steering

**File:** `backend/src/modules/exception-handling/exception-handling.module.ts`

**Purpose:** Detect when the conversation is drifting off-track and emit corrective steering prompts or trigger escalation.

```typescript
interface ExceptionHandlingInput extends ModuleInput {
  currentTranscript: TranscriptEntry[];
  conversationStrategy: ConversationStrategy;
  lastIntentLabel: string;
  turnsSinceGoalProgress: number;
}

interface ExceptionHandlingOutput extends ModuleOutput {
  action: ExceptionAction;
  steeringPrompt?: string;     // Injected into LLM context if action = 'steer'
  escalationReason?: string;   // Populated if action = 'escalate'
}

type ExceptionAction =
  | 'none'           // Conversation on track
  | 'steer'          // Inject steering prompt into next LLM call
  | 'redirect'       // Switch goal (e.g., drop side-topic, return to main objective)
  | 'escalate';      // Hand off to human
```

**Deviation detection rules:**

| Deviation | Detection | Action |
|-----------|-----------|--------|
| Off-topic for ≥ 2 turns | `intentLabel === 'off-topic'` × 2 | `steer` |
| Circular objection loop | Same objection detected ≥ 3 times | `escalate` |
| Aggressive tone from customer | Sentiment < -0.7 (rule-based) | `escalate` |
| No progress for N turns | `turnsSinceGoalProgress >= strategy.maxStallTurns` | `redirect` |
| Customer requests human | `intentLabel === 'human-request'` | `escalate` immediately |

**Implementation tasks:**
- [ ] Deviation rule engine (YAML-configurable thresholds)
- [ ] Steering prompt library: per-deviation prompt templates
- [ ] Escalation ticket creation: call `CRMAdapter.updateLeadStatus('escalated')` + create note
- [ ] `isFusable` → `true` when LLM adapter has built-in deviation detection
- [ ] `canSkip` → `true` when fused LLM handles deviation detection

---

## Module 10 — Conversation Logging and Analytics Hooks

**File:** `backend/src/modules/conversation-logging/conversation-logging.module.ts`

**Purpose:** Persist the complete call session and emit structured analytics events.

```typescript
interface ConversationLoggingInput extends ModuleInput {
  callSession: CallSession;
  assessmentResult?: AssessmentResult;
  newObjections: Objection[];    // Objections encountered but not in database
}

interface ConversationLoggingOutput extends ModuleOutput {
  logId: string;
  eventsEmitted: number;
}
```

**Analytics events emitted:**

```typescript
type AnalyticsEvent =
  | { type: 'call.completed';   payload: CallCompletedPayload }
  | { type: 'objection.new';    payload: ObjectionNewPayload }
  | { type: 'goal.achieved';    payload: GoalAchievedPayload }
  | { type: 'lead.recovered';   payload: LeadRecoveredPayload }
  | { type: 'lead.escalated';   payload: LeadEscalatedPayload };
```

**Implementation tasks:**
- [ ] Persist `CallSession` to database with full transcript
- [ ] Upsert new objections into `ObjectionDatabase`
- [ ] Emit analytics events to `EventBus` (pluggable in Phase 6 for external analytics)
- [ ] `canSkip` → `false` (logging is always mandatory)
- [ ] `isFusable` → `true` with any step (can be appended to any adapter)

---

## Analytics Hooks Architecture

```
Module 10 emits events
    │
    ▼
EventBus.emit(event)
    │
    ├──► InMemoryAnalyticsStore   (Phase 3: simple accumulator)
    └──► ExternalAnalyticsAdapter (Phase 6: plug in real service)
```

---

## Orchestrator Integration Tests

| Scenario | Config | Expected Execution Plan |
|----------|--------|------------------------|
| All modules, no fusion | Default | Steps 1→2→3→4→5→6→7→8→10 |
| CRM fusion enabled | `crm.supportsContextFusion: true` | Steps [1+2]→3→4→5→6→7→8→10 |
| Telephony-welcome fusion | `telephony.playsWelcomeOnConnect: true` | Steps 1→2→3→[4+5]→6→7→8→10 |
| Full conversational AI | `conversationalAi.useFullService: true` | Steps 1→2→3→[4+5+6+7]→8→10 |
| Exception handling skipped | `llm.hasBuiltInDeviation: true` | Steps 1→2→3→4→5→6→7→(skip 8)→10 |
| Required step fails after retries | Any | Workflow aborted; `workflow.failed` event; lead rescheduled |

---

## Configuration Management API

RESTful endpoints for runtime inspection (read-only in Phase 3; mutation in Phase 5 UI):

```
GET  /api/workflows                      List workflow configs
GET  /api/workflows/:id                  Get workflow config by ID
GET  /api/workflows/:id/plan             Dry-run execution plan (no actual call)
GET  /api/adapters                       List registered adapters + fusion capabilities
GET  /api/fusions                        List active fusion rules
```

---

## Directory Additions

```
backend/src/
├── orchestrator/
│   ├── workflow-orchestrator.ts
│   ├── execution-plan-builder.ts
│   ├── input-resolver.ts
│   ├── fusion-engine.ts
│   └── retry-executor.ts
├── modules/
│   ├── exception-handling/
│   └── conversation-logging/
├── adapters/
│   └── fused/
│       ├── crm-context-fused/
│       ├── telephony-welcome-fused/
│       └── full-conversational-ai/
├── analytics/
│   ├── event-bus.ts
│   └── in-memory-analytics-store.ts
└── api/
    └── workflows/
        └── workflows.controller.ts
```

---

## Acceptance Criteria

- [ ] Orchestrator builds correct execution plans for all 6 test scenarios
- [ ] Fusion rules activate only when their `condition` evaluates to `true`
- [ ] Skipped required steps throw `WorkflowPlanError` at plan-build time
- [ ] `defaultOutput` for skipped optional steps satisfies downstream inputs
- [ ] Module 8 (Exception Handling) steers conversation and escalates correctly
- [ ] Module 10 (Logging) persists full transcript and emits all analytics events
- [ ] Config Management API returns correct plans for dry-run requests
- [ ] Hybrid workflow test passes (mix of mock adapters + fused adapter)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| JSONLogic expression bugs in fusion conditions | Medium | High | Comprehensive unit tests per rule; dry-run API catches issues before calls |
| Input resolution cycle detection missed | Low | High | Plan builder performs topological sort; cycle = startup error |
| Third-party fused adapters don't match expected output shapes | Medium | Medium | Contract tests run against each fused adapter in CI |
| Config schema drift between YAML and TypeScript types | Medium | Medium | Generate TypeScript types from JSON Schema using `json-schema-to-typescript` |
