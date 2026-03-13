# Phase 2 — Core Call Workflow Implementation

**Duration:** 2–3 months  
**Depends on:** Phase 1 complete (interfaces, models, registry, config, logging)  
**Unlocks:** Phase 3 (Adaptability Framework)

---

## Objectives

Build and wire the primary call workflow — modules 3 through 7 from the [Call Workflow Plan](../conversation.md). By the end of this phase the system can execute a complete end-to-end call against mock third-party service implementations, with production integrations deferred to Phase 6.

---

## New Modules in This Phase

| Module ID | Name | Conversation Plan Step |
|-----------|------|----------------------|
| `call-preparation` | Call Preparation | Step 3 |
| `call-initiation` | Call Initiation | Step 4 |
| `welcome-message` | Welcome Message Generation | Step 5 |
| `response-processing` | Customer Response Processing | Step 6 |
| `conversation-loop` | Conversation Loop Management | Step 7 |

---

## Third-Party Service Integrations

### Service Abstraction Pattern

Every external service integration is hidden behind an adapter interface. A mock adapter ships alongside every real one so the workflow can be tested offline.

```
backend/src/adapters/
├── tts/
│   ├── tts-adapter.interface.ts
│   ├── eleven-labs-tts-adapter.ts
│   └── mock-tts-adapter.ts
├── stt/
│   ├── stt-adapter.interface.ts
│   ├── sarvam-stt-adapter.ts
│   └── mock-stt-adapter.ts
├── llm/
│   ├── llm-adapter.interface.ts
│   ├── gemini-llm-adapter.ts
│   └── mock-llm-adapter.ts
├── telephony/
│   ├── telephony-adapter.interface.ts
│   ├── twilio-telephony-adapter.ts
│   └── mock-telephony-adapter.ts
└── audio-cache/
    ├── audio-cache.interface.ts
    └── local-audio-cache.ts
```

### TTS Adapter (Eleven Labs)

```typescript
interface TTSRequest {
  text: string;
  voiceId: string;
  language: string;      // BCP-47
  stability?: number;    // 0–1
  similarityBoost?: number;
}

interface TTSResponse {
  audioBuffer: Buffer;
  durationSeconds: number;
  cacheKey: string;      // SHA-256 of (text + voiceId + language)
}

interface TTSAdapter {
  synthesize(req: TTSRequest): Promise<TTSResponse>;
}
```

**Implementation tasks:**
- [ ] `ElevenLabsTTSAdapter`: POST to `/v1/text-to-speech/{voiceId}` with API key from config
- [ ] Rate-limit handling: exponential backoff with jitter, max 3 retries
- [ ] `AudioCache`: check cache before calling API; store result keyed by `cacheKey`
- [ ] `MockTTSAdapter`: returns a pre-recorded silent WAV buffer from fixtures

### STT Adapter (Sarvam AI)

```typescript
interface STTRequest {
  audioBuffer: Buffer;
  language: string;       // BCP-47; Sarvam supports Indian languages
  sampleRateHz: number;   // 16000 or 8000
  encoding: 'wav' | 'mp3' | 'ogg';
}

interface STTResponse {
  transcript: string;
  confidence: number;     // 0–1
  language: string;       // Detected language
  wordTimings?: WordTiming[];
}

interface STTAdapter {
  transcribe(req: STTRequest): Promise<STTResponse>;
}
```

**Implementation tasks:**
- [ ] `SarvamSTTAdapter`: multipart POST to Sarvam `/asr` endpoint
- [ ] Language auto-detection fallback when `confidence < 0.6`
- [ ] `MockSTTAdapter`: returns scripted transcripts from fixture map keyed by audio hash

### LLM Adapter

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  stopSequences?: string[];
}

interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  promptTokens: number;
  completionTokens: number;
}

interface LLMAdapter {
  complete(req: LLMRequest): Promise<LLMResponse>;
}
```

**Implementation tasks:**
- [ ] `GeminiLLMAdapter`: integrate against Gemini API contract and keep it behind the generic `LLMAdapter` interface
- [ ] System prompt templating with funnel context injection
- [ ] Token budget guard: reject requests over configured `maxPromptTokens`
- [ ] `MockLLMAdapter`: returns scripted responses from fixture map keyed by last user message

### Telephony Adapter

```typescript
interface CallInitiationRequest {
  fromNumber: string;
  toNumber: string;       // E.164; retrieve from secured customer record
  callbackUrl: string;    // Webhook for call events
  metadata: Record<string, string>;
}

interface CallSession {
  providerCallId: string;
  status: 'ringing' | 'answered' | 'completed' | 'failed';
}

interface TelephonyAdapter {
  initiateCall(req: CallInitiationRequest): Promise<CallSession>;
  hangUp(providerCallId: string): Promise<void>;
  streamAudio(providerCallId: string, audio: Buffer): Promise<void>;
  onEvent(handler: (event: CallEvent) => void): void;
}
```

**Implementation tasks:**
- [ ] `TwilioTelephonyAdapter`: using Twilio REST API + webhook handling
- [ ] Secure webhook validation (Twilio signature verification)
- [ ] `MockTelephonyAdapter`: simulates ringing, answer, and hangup with configurable delays

---

## Module 3 — Call Preparation

**File:** `backend/src/modules/call-preparation/call-preparation.module.ts`

**Purpose:** Analyse the customer's full journey, cross-reference the objection database, select the AI agent's policies, and build the conversational context that will drive the LLM.

```typescript
interface CallPreparationInput extends ModuleInput {
  customer: Customer;
  lead: Lead;
  funnelContext: FunnelContext;
}

interface CallPreparationOutput extends ModuleOutput {
  conversationStrategy: ConversationStrategy;
}

interface ConversationStrategy {
  systemPrompt: string;                    // Pre-built LLM system prompt
  anticipatedObjections: Objection[];
  resolutionScripts: ObjectionScript[];
  agentPersona: AgentPersona;
  maxTurns: number;
  goals: ConversationGoal[];
}

interface ConversationGoal {
  id: string;
  description: string;
  completionSignal: string;   // Natural-language signal the LLM looks for
  isMandatory: boolean;
}
```

**Implementation tasks:**
- [ ] Objection database service: `ObjectionDatabaseService.getForStage(funnelId, stageId)`
- [ ] System prompt builder: inject customer name, stage description, anticipated objections, re-engagement URL, and company policy bullets
- [ ] Agent persona config: per-funnel configurable (name, language, tone, voice ID)
- [ ] `isFusable` → `false` (must run locally before call is initiated)
- [ ] `canSkip` → `false`
- [ ] Unit tests: verify prompt injection, objection mapping, goal list construction

---

## Module 4 — Call Initiation

**File:** `backend/src/modules/call-initiation/call-initiation.module.ts`

**Purpose:** Establish the phone connection via the configured telephony adapter.

```typescript
interface CallInitiationInput extends ModuleInput {
  customer: Customer;
  lead: Lead;
  callbackBaseUrl: string;
}

interface CallInitiationOutput extends ModuleOutput {
  providerCallId: string;
  callSessionId: string;
  status: 'ringing' | 'answered';
}
```

**Implementation tasks:**
- [ ] Inject `TelephonyAdapter`; call `initiateCall` with from-number from config
- [ ] Write `CallSession` record to database with `status: 'initiating'`
- [ ] Poll or await webhook for answer event (timeout configurable, default 45 s)
- [ ] On no-answer: mark lead `callAttempts++`; schedule retry if under `maxCallAttempts`
- [ ] `isFusable('welcome-message')` → `true` when telephony service supports pre-recorded welcome
- [ ] `canSkip` → `false`
- [ ] Unit test: mock adapter simulates answer after 2 s; assert `callSessionId` written

---

## Module 5 — Welcome Message Generation

**File:** `backend/src/modules/welcome-message/welcome-message.module.ts`

**Purpose:** Deliver the opening greeting to the customer.

```typescript
interface WelcomeMessageInput extends ModuleInput {
  providerCallId: string;
  customer: Customer;
  funnelContext: FunnelContext;
  agentPersona: AgentPersona;
}

interface WelcomeMessageOutput extends ModuleOutput {
  welcomeAudioRef: string;      // Storage reference or stream URL
  deliveredAt: Date;
}
```

**Resolution priority:**
1. Cached audio (exact match on customer name + stage + language + voice ID)
2. Real-time TTS generation via `TTSAdapter`
3. Fallback: text only (log warning; TTS unavailable)

**Template:**
```
Hi {customerFirstName}, this is {agentName} calling from {companyName}.
I noticed you were exploring our {productName} recently and wanted to check
in to see if I can help you complete the process. Do you have a couple of
minutes?
```

**Implementation tasks:**
- [ ] Message template engine: `{{variable}}` substitution with safe escaping
- [ ] `AudioCache.get(cacheKey)` before calling TTS; `AudioCache.put` after generation
- [ ] Stream audio buffer to call via `TelephonyAdapter.streamAudio`
- [ ] `isFusable('call-initiation')` → `true` (some telephony APIs play welcome on connect)
- [ ] `canSkip` → `false`
- [ ] Unit test: cache hit path, cache miss path, fallback path

---

## Module 6 — Customer Response Processing

**File:** `backend/src/modules/response-processing/response-processing.module.ts`

**Purpose:** Convert customer speech to text, analyse intent, generate an AI response, and deliver it as speech.

```typescript
interface ResponseProcessingInput extends ModuleInput {
  providerCallId: string;
  audioBuffer: Buffer;
  conversationHistory: TranscriptEntry[];
  conversationStrategy: ConversationStrategy;
}

interface ResponseProcessingOutput extends ModuleOutput {
  customerText: string;
  agentText: string;
  agentAudioRef: string;
  intentLabel: string;         // e.g. 'objection', 'consent', 'question', 'off-topic'
  detectedObjection?: Objection;
  turnNumber: number;
}
```

**Pipeline:**

```
AudioBuffer
    │
    ▼
[STT Adapter]  ──────────────────────────────► customerText
    │
    ▼
[Intent Classifier]  ─────────────────────────► intentLabel, detectedObjection?
    │                   (rule-based in Phase 2;
    │                    ML-based in Phase 4)
    ▼
[LLM Adapter]  ──────────────────────────────► agentText
  (system prompt = conversationStrategy.systemPrompt)
  (history = conversationHistory)
    │
    ▼
[TTS Adapter / Cache]  ───────────────────────► agentAudioRef
    │
    ▼
[TelephonyAdapter.streamAudio]
```

**Implementation tasks:**
- [ ] `RuleBasedIntentClassifier`: keyword / regex matcher for common objections per language
  - Patterns configured in YAML: `objectionPatterns`, `consentPatterns`, `questionPatterns`
- [ ] LLM prompt construction: system prompt + last 10 turns of conversation history
- [ ] Append `customerText` and `agentText` to `CallSession.transcript`
- [ ] Detect when customer says goodbye/hang-up keywords → signal conversation end
- [ ] `isFusable('conversation-loop')` → `true`
- [ ] `canSkip` → `false`
- [ ] Unit tests for STT mock → intent classification → LLM mock → TTS mock pipeline

---

## Module 7 — Conversation Loop Management

**File:** `backend/src/modules/conversation-loop/conversation-loop.module.ts`

**Purpose:** Drive the dialogue until a terminal condition is reached.

```typescript
interface ConversationLoopInput extends ModuleInput {
  providerCallId: string;
  callSessionId: string;
  conversationStrategy: ConversationStrategy;
  initialTranscript: TranscriptEntry[];  // Contains welcome message
}

interface ConversationLoopOutput extends ModuleOutput {
  finalTranscript: TranscriptEntry[];
  endReason: ConversationEndReason;
  turnCount: number;
  detectedObjections: Objection[];
}

type ConversationEndReason =
  | 'goal-achieved'
  | 'max-turns-reached'
  | 'customer-declined'
  | 'customer-hung-up'
  | 'escalation-triggered'
  | 'error';
```

**State machine:**

```
IDLE
  │  customer audio received
  ▼
PROCESSING  (invoke ResponseProcessingModule)
  │  response delivered
  ├──► PROCESSING  (next turn, if not terminal)
  │
  └──► TERMINAL  (goal-achieved | max-turns | declined | hung-up | escalation)
         │
         ▼
       EXIT  → return ConversationLoopOutput
```

**Loop termination conditions:**
- `goal-achieved`: LLM signals all mandatory goals completed
- `max-turns-reached`: `turnCount >= strategy.maxTurns`
- `customer-declined`: intent classifier emits `hard-rejection` with confidence ≥ 0.85
- `customer-hung-up`: telephony event `call.ended`
- `escalation-triggered`: exception handling module (Phase 3) requests human hand-off
- `error`: unrecoverable module failure after retry

**Implementation tasks:**
- [ ] Event-driven loop listening on telephony adapter audio events
- [ ] Turn counter enforced against `conversationStrategy.maxTurns`
- [ ] Collect `detectedObjections` from all `ResponseProcessingOutput`s
- [ ] Emit structured `conversation.turn.completed` events for analytics
- [ ] `isFusable('response-processing')` → `true` (conversational AI services handle both)
- [ ] `canSkip` → `false`
- [ ] Integration test: 5-turn mock conversation; assert correct `endReason` and transcript

---

## Conversation State

```typescript
interface ConversationState {
  callSessionId: string;
  phase: 'welcome' | 'dialogue' | 'closing' | 'escalation' | 'ended';
  turnCount: number;
  goalsAchieved: string[];       // IDs of completed ConversationGoals
  pendingObjections: Objection[];
  lastCustomerIntent: string;
}
```

Stored in-memory during the call; persisted to the database when the call ends.

---

## Objection Database

```typescript
interface ObjectionDatabase {
  getForStage(funnelId: string, stageId: string): Promise<Objection[]>;
  getById(id: string): Promise<Objection>;
  upsert(objection: Omit<Objection, 'id'>): Promise<Objection>;
  searchByKeywords(keywords: string[]): Promise<Objection[]>;
}
```

**Initial data:** Seed the credit card application funnel objections from [funnel-definition.md](../funnel-definition.md) stages 1–13.

---

## Assessment Mechanism (Rule-Based — Phase 2)

A lightweight scorer runs at the end of each call before Phase 4 introduces ML-based scoring.

```typescript
interface AssessmentResult {
  score: number;             // 0–1
  factors: AssessmentFactor[];
  recommendation: 'close-recovered' | 'schedule-follow-up' | 'escalate' | 'close-failed';
}

interface AssessmentFactor {
  name: string;
  weight: number;
  value: number;
  label: string;
}
```

**Rule-based factors:**

| Factor | Weight | Positive Signal |
|--------|--------|-----------------|
| Goals achieved | 0.40 | All mandatory goals met |
| No hard rejection | 0.25 | `customer-declined` not triggered |
| Objections resolved | 0.20 | All detected objections handled |
| Call duration | 0.10 | > 90 s and < 10 min |
| Turn efficiency | 0.05 | Goals reached in < 70% of maxTurns |

---

## Performance Benchmarks

Target: **< 5 seconds** wall-clock time from receipt of customer audio to start of agent audio stream.

| Step | P95 Budget |
|------|-----------|
| STT transcription | 800 ms |
| Intent classification | 50 ms |
| LLM response generation | 2,500 ms |
| TTS synthesis (or cache hit) | 400 ms (50 ms) |
| Network + streaming overhead | 400 ms |
| **Total** | **4,150 ms** |

**Implementation tasks:**
- [ ] Add `durationMs` timing to every adapter call
- [ ] `PerformanceMonitor` utility: emit `latency.exceeded` event when any step > 80% of budget
- [ ] Run benchmark suite against mock adapters in CI to detect regressions

---

## Directory Additions

```
backend/src/
├── modules/
│   ├── call-preparation/
│   ├── call-initiation/
│   ├── welcome-message/
│   ├── response-processing/
│   └── conversation-loop/
├── adapters/
│   ├── tts/
│   ├── stt/
│   ├── llm/
│   ├── telephony/
│   └── audio-cache/
├── services/
│   ├── objection-database.service.ts
│   ├── intent-classifier.service.ts
│   ├── assessment.service.ts
│   └── prompt-builder.service.ts
└── db/
    ├── migrations/
    └── seeds/
    └── bob-credit-card-funnel.seed.ts
```

---

## Integration Tests

| Test Scenario | Expected Outcome |
|---------------|-----------------|
| Happy path: customer agrees to re-engage | `endReason: goal-achieved`, score ≥ 0.7 |
| Customer declines immediately | `endReason: customer-declined`, score < 0.3 |
| Customer hangs up mid-conversation | `endReason: customer-hung-up`, partial transcript saved |
| Max turns reached without resolution | `endReason: max-turns-reached`, follow-up scheduled |
| TTS service unavailable | Fallback logged, text-only mode, call continues |
| STT returns empty transcript | Retry once; if still empty, escalate |

---

## Acceptance Criteria

- [ ] End-to-end call simulation completes using all mock adapters
- [ ] P95 response latency < 5 s measured against mock adapters in CI
- [ ] All 5 modules pass unit tests with ≥ 80% coverage
- [ ] Integration test suite covers all 6 scenarios above
- [ ] Conversation transcript written to `CallSession` record for every turn
- [ ] Rule-based `AssessmentResult` produced for every completed call
- [ ] All PII (phone, name) masked in logs

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sarvam AI API contract changes before Phase 6 | Medium | High | Adapter pattern isolates change; mock adapter keeps CI green |
| LLM response latency exceeds budget | Medium | High | Budget enforcement + fallback to shorter prompts; surfaced via `PerformanceMonitor` |
| Audio streaming reliability on Twilio webhook | Medium | Medium | Retry audio stream up to 2×; fall back to polling if event webhook fails |
| Complex conversation state edge cases | High | Medium | Exhaustive state-machine unit tests; log every state transition |
