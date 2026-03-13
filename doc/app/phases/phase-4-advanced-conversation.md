# Phase 4 — Advanced Conversation Features

**Duration:** 2 months  
**Depends on:** Phase 3 complete (Orchestrator, Modules 8 and 10, analytics hooks)  
**Unlocks:** Phase 5 (UI & Administration)

---

## Objectives

Upgrade the conversation pipeline from rule-based heuristics to a data-driven system: ML-based scoring, enriched analytics, model training infrastructure, and a reliable escalation flow that closes the loop with human agents.

---

## New Capabilities

| Capability | Replaces / Extends |
|------------|-------------------|
| ML-based conversion probability (Module 9) | Rule-based scorer from Phase 2 |
| Advanced exception-handling algorithms | Threshold rules from Phase 3 |
| Full analytics pipeline | In-memory accumulator from Phase 3 |
| Model training infrastructure | — (new) |
| Human escalation flow | `CRMAdapter.updateLeadStatus('escalated')` stub from Phase 3 |
| Objection identification & auto-storage | Manual seeding from Phase 2 |

---

## Module 9 — Accomplishment Assessment (ML-Based)

**File:** `backend/src/modules/accomplishment-assessment/accomplishment-assessment.module.ts`

### Purpose

Produce a continuous 0–1 conversion probability score by evaluating the full call transcript, the goals achieved, and the objections encountered — using a trained inference model rather than hard-coded weights.

### Interfaces

```typescript
interface AccomplishmentAssessmentInput extends ModuleInput {
  callSession: CallSession;
  conversationStrategy: ConversationStrategy;
}

interface AccomplishmentAssessmentOutput extends ModuleOutput {
  conversionProbability: number;           // 0–1
  goalAchievementRate: number;             // 0–1 (mandatory goals met / total)
  momentumScore: number;                   // 0–1 (turn-over-turn progress)
  rejectionConfidence: number;             // 0–1 (how firmly customer declined)
  objectionsResolved: number;              // Count
  objectionsUnresolved: number;            // Count
  recommendation: AssessmentRecommendation;
  modelVersion: string;
  factors: AssessmentFactor[];
}

type AssessmentRecommendation =
  | 'close-recovered'
  | 'schedule-follow-up'
  | 'escalate-warm'        // Escalate with positive context (customer interested)
  | 'escalate-cold'        // Escalate after failed recovery
  | 'close-failed';
```

### Scoring Model Architecture

**Phase 4 initial model:** Logistic regression trained on Phase 2/3 conversation logs (synthetic data until sufficient real data accumulated).

**Feature vector:**

| Feature | Type | Description |
|---------|------|-------------|
| `goalAchievementRate` | float [0,1] | Fraction of mandatory goals completed |
| `totalTurns` | int | Number of dialogue turns |
| `turnsToFirstGoal` | int | Turns before first goal completed |
| `objectionCount` | int | Total objections encountered |
| `resolvedObjectionRate` | float [0,1] | Resolved / total objections |
| `hardRejectionEncountered` | bool | Whether customer hard-rejected |
| `escalationTriggered` | bool | Whether exception-handling escalated |
| `sentimentTrajectory` | float [-1,1] | Sentiment slope across transcript |
| `callDurationSeconds` | int | Total call duration |
| `avgAgentResponseMs` | int | Mean response latency |
| `stageDropDepth` | int | How many funnel stages behind the lead is |
| `previousCallAttempts` | int | How many prior call attempts |

**Implementation tasks:**
- [ ] `FeatureExtractor` service: converts `CallSession` + `ConversationStrategy` → feature vector
- [ ] `MLAssessmentModel` interface: `predict(features: FeatureVector): Promise<number>`
- [ ] `LogisticRegressionModel`: in-process inference using pre-trained weights (JSON/ONNX)
- [ ] `MockAssessmentModel`: deterministic output for tests (returns 0.8 for goal-achieved, 0.2 for rejected)
- [ ] `ModelRegistry`: load model by version; support hot-swap without restart
- [ ] Fallback to Phase 2 rule-based scorer if model unavailable (graceful degradation)
- [ ] Log `modelVersion` + feature vector on every assessment (for training data collection)

---

## Sentiment Analysis

Required by the feature extractor and the enhanced exception-handling algorithm.

### Interface

```typescript
interface SentimentAnalyzer {
  analyzeText(text: string, language: string): SentimentResult;
  analyzeTranscript(entries: TranscriptEntry[], language: string): SentimentTimeline;
}

interface SentimentResult {
  score: number;         // -1 (very negative) to +1 (very positive)
  magnitude: number;     // 0–1, intensity regardless of polarity
  label: 'positive' | 'negative' | 'neutral';
}

interface SentimentTimeline {
  entries: Array<{ timestamp: Date; score: number }>;
  overallScore: number;
  slope: number;         // Positive = improving sentiment; negative = deteriorating
}
```

**Implementation tasks:**
- [ ] `LexiconSentimentAnalyzer`: dictionary-based scorer supporting `en`, `hi`, `ta`, `te`, `mr` (using open-licensed word lists)
- [ ] `MockSentimentAnalyzer` for tests
- [ ] Integration into `FeatureExtractor`

---

## Enhanced Exception Handling

Extends Phase 3's rule-based detection with sentiment-aware and momentum-aware logic.

### Enhanced Deviation Detection

```typescript
interface DeviationSignal {
  type: DeviationSignalType;
  confidence: number;           // 0–1
  evidenceTurns: number[];      // Turn indices that triggered this signal
}

type DeviationSignalType =
  | 'off-topic'
  | 'circular-objection'
  | 'deteriorating-sentiment'
  | 'stalled-momentum'
  | 'explicit-human-request'
  | 'aggressive-language'
  | 'call-fatigue';             // Customer repeatedly asking to end call
```

**Steering Algorithm:**

```
EVALUATE all signals each turn:
  IF any signal.confidence ≥ escalation_threshold → ESCALATE immediately
  ELSE IF cumulative_deviation_score > redirect_threshold:
    SELECT most relevant steering prompt
    INJECT into next LLM message as system addendum
    RESET cumulative score
  ELSE → no action
```

**Configurable thresholds (per funnel/stage in YAML):**

```yaml
deviationThresholds:
  escalation: 0.85
  redirect: 0.60
  sentimentFloor: -0.70
  maxStallTurns: 3
  maxCircularObjections: 3
```

**Implementation tasks:**
- [ ] Merge `SentimentTimeline` + intent history into `DeviationSignal` list
- [ ] Cumulative deviation score accumulator (windowed, not global)
- [ ] Steering prompt selector: ranked by signal type and stage context
- [ ] Enhanced escalation reason: include top 3 deviation signals in escalation note
- [ ] Unit tests: edge cases for each `DeviationSignalType`

---

## Analytics Pipeline

Replaces the Phase 3 `InMemoryAnalyticsStore` with a proper, extensible pipeline.

### Architecture

```
Module 10 emits AnalyticsEvent
        │
        ▼
AnalyticsPipeline
  ├── [Enricher] — attaches funnel metadata, stage name, product name
  ├── [Filter]  — drops events below configured importance threshold
  └── [Fanout]
        ├──► TimeSeriesStore  (in-process; rolling 30-day window)
        ├──► AggregateStore   (running counters: calls, recoveries, etc.)
        └──► ExternalAdapter  (Phase 6: pluggable external sink)
```

### Metrics Tracked

| Metric | Granularity | Description |
|--------|-------------|-------------|
| `calls.total` | Day, funnel, stage | Total calls initiated |
| `calls.answered` | Day, funnel, stage | Calls answered by customer |
| `calls.recovered` | Day, funnel, stage | Calls resulting in recovery |
| `calls.escalated` | Day, funnel, stage | Calls escalated to human |
| `calls.failed` | Day, funnel, stage | Calls that failed irrecoverably |
| `objections.encountered` | Day, funnel, stage | Unique objection types seen |
| `objections.resolved` | Day, funnel, stage | Objections resolved by AI |
| `conversionRate` | Week, funnel | `recovered / total_attempted` |
| `avgCallDuration` | Day, funnel | Mean call duration in seconds |
| `avgResponseLatency` | Day | P50/P95 response latency |
| `modelVersion` | Per call | Assessment model version used |

### Analytics Query Interface

```typescript
interface AnalyticsQuery {
  metric: string;
  from: Date;
  to: Date;
  groupBy?: 'day' | 'week' | 'month';
  filters?: { funnelId?: string; stageId?: string; productId?: string };
}

interface AnalyticsResult {
  metric: string;
  dataPoints: Array<{ timestamp: Date; value: number }>;
  aggregates: { sum: number; avg: number; min: number; max: number };
}

interface AnalyticsStore {
  query(q: AnalyticsQuery): Promise<AnalyticsResult>;
  getLatestAggregates(): Promise<Record<string, number>>;
}
```

**Implementation tasks:**
- [ ] `AnalyticsPipeline` class with enricher, filter, and fanout stages
- [ ] `TimeSeriesStore`: circular buffer, JSON-serialisable, survives restart via file persistence
- [ ] `AggregateStore`: atomic counters, persisted to database
- [ ] Metrics endpoint: `GET /api/analytics/metrics?metric=...&from=...&to=...`
- [ ] Dashboard summary endpoint: `GET /api/analytics/summary` (returns latest aggregates for Phase 5 dashboard)

---

## Model Training Infrastructure

### Training Data Pipeline

```
CallSession records in DB
    │
    ▼
TrainingDataExtractor
  ├── Filter: only sessions > 30 days old (to avoid recency bias)
  ├── Anonymise: strip PII (name, phone, email)
  └── Label: derive ground-truth outcome from lead.status
         (recovered → 1; failed/escalated-cold → 0)
    │
    ▼
FeatureExtractor  →  FeatureVectors (CSV / Parquet)
    │
    ▼
ModelTrainer  →  New model weights (JSON/ONNX)
    │
    ▼
ModelEvaluator  →  Accuracy, AUC-ROC, precision, recall on held-out set
    │  IF metrics > current model
    ▼
ModelRegistry.promote(newVersion)
```

### Training Script

**File:** `backend/src/ml/train.ts`

Invokable via:

```bash
npm run ml:train -- --minSamples 200 --evalSplit 0.2
```

CI trigger: weekly cron job or when training data count crosses a threshold.

**Implementation tasks:**
- [ ] `TrainingDataExtractor`: SQL query + PII scrubbing
- [ ] `ModelTrainer`: logistic regression with `ml-matrix` (no external Python required in Phase 4)
- [ ] `ModelEvaluator`: compute AUC-ROC, log confusion matrix
- [ ] `ModelRegistry`: versioned model storage (`backend/models/v{n}.json`), hot-swap support
- [ ] Promotion guard: new model must beat current model on AUC-ROC by ≥ 0.02
- [ ] Minimum training sample gate: `--minSamples` flag (default 200)

---

## Objection Identification and Auto-Storage

When `ResponseProcessingModule` detects an objection via `RuleBasedIntentClassifier` that does **not** match any existing database entry, it flags it as `unknown`.

```typescript
interface UnknownObjectionEvent {
  callSessionId: string;
  funnelId: string;
  stageId: string;
  customerText: string;    // Raw text that triggered flag (PII-scrubbed)
  similarObjectionIds: string[];   // Nearest neighbours from existing DB
}
```

**Processing:**

1. Emit `objection.unknown` analytics event
2. Add to `PendingObjectionQueue` (database table)
3. Admin UI (Phase 5) shows queue; admin can approve → auto-insert into `ObjectionDatabase`, reject, or merge with existing

**Implementation tasks:**
- [ ] `PendingObjectionQueue` table migration
- [ ] Similarity search: cosine similarity on TF-IDF vectors over `ObjectionDatabase`
- [ ] `GET /api/objections/pending` — list pending for review
- [ ] `POST /api/objections/pending/:id/approve` — promote to database
- [ ] `POST /api/objections/pending/:id/reject` — dismiss

---

## Escalation Flow

```
ExceptionHandlingModule emits action = 'escalate'
        │
        ▼
EscalationService
  1. Update lead.status → 'escalated' via CRMAdapter
  2. Create EscalationTicket (reason, full transcript, topObjections, agentId)
  3. Emit 'lead.escalated' analytics event
  4. Notify human agent via configured channel:
       - Email (Phase 4: SMTP stub)
       - CRM task assignment (Phase 4: CRMAdapter.createTask)
       - Webhook (Phase 4: configurable HTTP POST)
  5. Optionally deliver closing message to customer:
       "I'm going to connect you with a specialist who can help..."
```

```typescript
interface EscalationTicket {
  id: string;
  leadId: string;
  callSessionId: string;
  reason: string;
  deviationSignals: DeviationSignal[];
  transcriptSummary: string;          // LLM-generated 3-sentence summary
  topObjections: Objection[];
  assignedTo?: string;                // Human agent ID from CRM
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
}
```

**Implementation tasks:**
- [ ] `EscalationService` with notification channel abstraction
- [ ] `EmailNotificationAdapter`: SMTP stub (real SMTP in Phase 6)
- [ ] `WebhookNotificationAdapter`: HTTP POST with HMAC-SHA256 signature
- [ ] LLM-generated transcript summary (3 sentences; inject into `EscalationTicket.transcriptSummary`)
- [ ] `GET /api/escalations` — admin view of open tickets
- [ ] `PATCH /api/escalations/:id/resolve` — mark resolved

---

## Directory Additions

```
backend/src/
├── ml/
│   ├── feature-extractor.ts
│   ├── model-registry.ts
│   ├── model-trainer.ts      (training script)
│   ├── model-evaluator.ts
│   └── models/               (version JSON files, git-tracked)
├── analytics/
│   ├── analytics-pipeline.ts
│   ├── analytics-enricher.ts
│   ├── time-series-store.ts
│   ├── aggregate-store.ts
│   └── analytics.controller.ts
├── services/
│   ├── sentiment-analyzer.service.ts
│   ├── escalation.service.ts
│   └── pending-objection-queue.service.ts
└── modules/
    └── accomplishment-assessment/
```

---

## Acceptance Criteria

- [ ] `AccomplishmentAssessmentModule` produces a score between 0 and 1 for every call
- [ ] Feature extractor generates all 12 features without errors on fixture call sessions
- [ ] Model training script runs end-to-end on synthetic data and produces a promotable model
- [ ] Promoted model loaded by `ModelRegistry` without restart
- [ ] `SentimentAnalyzer` returns correct polarity for English and Hindi test sentences
- [ ] Enhanced exception handling triggers correct action for each deviation type
- [ ] Analytics pipeline persists at least 7 named metrics per call
- [ ] `GET /api/analytics/summary` returns non-empty results after 1 test call
- [ ] Unknown objection queued and retrievable via `GET /api/objections/pending`
- [ ] Escalation ticket created with transcript summary and webhook notification fired

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient training data in early production | High | Medium | Synthetic data generator for Phase 4 testing; gate promotion on `minSamples` |
| LLM cost for transcript summary generation | Low | Low | Single summarisation call per escalation; cache by `callSessionId` |
| PII in training data | Medium | High | PII scrubbing step is mandatory before any data reaches `ModelTrainer`; audit logged |
| Model regression after training | Medium | High | Promotion gate: AUC-ROC must exceed current model; fallback to rule-based scorer |
| Escalation notification delivery failure | Low | High | Webhook retry with exponential backoff; secondary email fallback |
