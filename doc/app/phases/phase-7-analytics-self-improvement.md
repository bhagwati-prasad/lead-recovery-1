# Phase 7 — Advanced Analytics and Self-Improvement

**Duration:** Ongoing (begin after Phase 6 ships to production)  
**Depends on:** Phase 6 complete (production system running, real call data accumulating)  
**Unlocks:** Continuous improvement loop; no hard end date

---

## Objectives

Use real production data to close the improvement loop: predictive lead scoring, smarter funnel configuration suggestions, automated model retraining, and advanced reporting — so the system gets measurably better at recovering leads over time without manual intervention.

---

## Capability Roadmap

| Capability | Priority | Trigger |
|------------|----------|---------|
| Automated model retraining pipeline | P0 | Weekly cron / data threshold |
| Predictive lead scoring (pre-call) | P0 | ≥ 500 labelled call sessions |
| Advanced analytics dashboard (Phase 5 extension) | P0 | Phase 7 start |
| Funnel improvement suggestions | P1 | ≥ 30 days of production data |
| Real-time admin suggestions | P1 | Predictive model stable |
| Expanded integrations (SMS, email, WhatsApp) | P2 | Business priority |
| API enhancements for external consumers | P2 | Partner demand |
| Multi-language model fine-tuning | P2 | Language-specific data available |

---

## Automated Model Retraining Pipeline

### Architecture

```
[Cron: weekly / threshold trigger]
    │
    ▼
TrainingDataExtractor
  ├── Pull CallSessions ≥ 30 days old, not yet used for training
  ├── PII-scrub (mandatory)
  └── Label using lead.status (recovered=1 / failed=0 / escalated=0.5)
    │
    ▼
IncrementalDataset
  (merge with previous training set; cap at 50,000 rows to control cost)
    │
    ├──► ModelTrainer          → candidate model weights
    │       (logistic regression → gradient boosted trees as data grows)
    │
    └──► ModelEvaluator
           ├── AUC-ROC on 20% held-out set
           ├── Precision / recall at 0.5 threshold
           ├── Calibration curve (is a score of 0.7 really 70% probable?)
           └── Fairness check: no significant accuracy gap across languages
    │
    ├── PASS: new model beats current by ≥ 0.02 AUC-ROC
    │       → ModelRegistry.promote(newVersion)
    │       → emit 'model.promoted' event
    │       → notify admin: "Model updated to v{n}; AUC-ROC improved by {delta}"
    │
    └── FAIL: log reason; keep current model; alert admin if 3 consecutive failures
```

### Trigger Conditions

| Trigger | Condition |
|---------|-----------|
| Data threshold | New labelled sessions since last training ≥ 200 |
| Weekly cron | Every Sunday 02:00 UTC regardless of data count |
| Manual | `POST /api/ml/train` (admin only) |
| Emergency rollback | `POST /api/ml/rollback` → restore previous version |

### Model Evolution Strategy

| Data Volume | Model Type | Rationale |
|-------------|-----------|-----------|
| < 500 samples | Logistic regression (Phase 4) | Stable with small data; interpretable |
| 500–5,000 | Gradient Boosted Trees (XGBoost-compatible JSON) | Better non-linear signals |
| > 5,000 | Fine-tuned sentence transformer + XGBoost | Encode transcript text features |
| > 50,000 | Full LLM-based assessment (Gemini or equivalent fine-tune) | Leverage language understanding |

**Implementation tasks:**
- [ ] `ModelVersionManager`: tracks version, training date, sample count, evaluation metrics in DB
- [ ] Model type auto-selection based on current dataset size
- [ ] Training job as an isolated Node.js worker (does not share memory with call-serving process)
- [ ] Post-promotion smoke test: run 10 fixture call sessions through new model; assert scores in expected range
- [ ] Model artefact versioning: store weights in `backend/models/v{n}.json`; keep last 5 versions for rollback
- [ ] `GET /api/ml/history` — list model versions with metrics
- [ ] `GET /api/ml/current` — current model version + live performance stats

---

## Predictive Lead Scoring (Pre-Call)

Phase 2 calculates a `conversionScore` post-call. Phase 7 adds a **pre-call** probability score assigned when a lead enters the system, allowing the scheduler to prioritise high-probability leads.

### Pre-Call Feature Vector

| Feature | Source |
|---------|--------|
| `funnelStageDropDepth` | How many stages before goal |
| `dropOffReason` | CRM field (if available) |
| `daysSinceDropOff` | `Date.now() - lead.droppedAt` |
| `previousCallAttempts` | `lead.callAttempts` |
| `customerLanguage` | `customer.language` |
| `stageObjectionCount` | Count of objections for this stage in DB |
| `historicalStageRecoveryRate` | Analytics: `recovered / attempted` for this funnel + stage |
| `hourOfDay` | When the lead will be called (scheduling signal) |
| `dayOfWeek` | Same |

### Scoring Model

Separate model from post-call assessment (different features, different ground truth).

**Ground truth label:** Was the lead ultimately recovered within 90 days of entry?

**API:**
```
POST /api/leads/:id/score
Response: { conversionProbability: 0.72, modelVersion: "v3", computedAt: "..." }
```

**Scheduler integration:** leads sorted by `conversionScore DESC` before scheduling; configurable per funnel (some funnels may prefer FIFO over score order).

**Implementation tasks:**
- [ ] `PreCallFeatureExtractor` service
- [ ] Separate `PreCallScoringModel` in `ModelRegistry`
- [ ] Score computed on lead ingestion and updated after each call attempt
- [ ] Score visible in Customers UI (badge on each lead)
- [ ] `GET /api/leads?sortBy=conversionScore&order=desc` — sorted list for admin

---

## Advanced Analytics Dashboard (Extensions to Phase 5)

### New Views and Charts

**Conversion Funnel Chart**
- X-axis: funnel stages (1–13 for credit card funnel)
- Y-axis: leads remaining / recovery rate per stage
- Highlights: stages with recovery rate significantly below average (anomaly annotation)

**Objection Heatmap**
- Matrix: stage × objection type × frequency
- Colour: frequency (low = cool; high = warm)
- Click cell: drill into transcripts where objection occurred

**Model Performance Over Time**
- AUC-ROC trend line per model version
- Precision/recall curves
- Calibration plot

**Lead Cohort Analysis**
- Group leads by drop-off date (weekly cohorts)
- Track recovery rate over time for each cohort
- Identify whether recent changes improved outcomes

**Forecasting Widget**
- 30-day rolling average conversion rate
- Simple linear extrapolation with confidence band
- "At current rate, you will recover ~N leads next month"

### Analytics API Enhancements

```
GET  /api/analytics/funnel-chart?funnelId=&from=&to=
GET  /api/analytics/objection-heatmap?funnelId=&stageId=&from=&to=
GET  /api/analytics/model-performance?modelVersion=
GET  /api/analytics/cohorts?groupBy=week&from=&to=
GET  /api/analytics/forecast?metric=conversionRate&days=30
GET  /api/analytics/leads/top?limit=10&funnelId=
```

**Implementation tasks:**
- [ ] Cohort builder: SQL GROUP BY `DATE_TRUNC('week', lead.createdAt)`
- [ ] Forecast algorithm: exponential weighted moving average (EWMA) with configurable alpha
- [ ] Anomaly detection: flag stages where recovery rate is > 1.5σ below funnel mean
- [ ] Export: all chart data exportable as CSV via `?format=csv`

---

## Funnel Improvement Suggestions

### Suggestion Engine

Analyses production data to surface actionable recommendations to administrators.

```typescript
interface FunnelSuggestion {
  id: string;
  funnelId: string;
  stageId?: string;
  type: SuggestionType;
  title: string;
  description: string;
  evidence: SuggestionEvidence;
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'dismissed';
}

type SuggestionType =
  | 'add-objection-script'
  | 'update-objection-script'
  | 'adjust-max-turns'
  | 'change-call-time-window'
  | 'reprioritise-stage'
  | 'escalation-threshold-adjustment';

interface SuggestionEvidence {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  sampleSize: number;
}
```

**Suggestion rules:**

| Rule | Trigger | Suggestion |
|------|---------|-----------|
| High unresolved objection rate | Objection X resolved < 30% of encounters | `add-objection-script` or `update-objection-script` |
| Stalled stage recovery | Stage recovery rate < 50% for ≥ 30 calls | `adjust-max-turns` + investigate objections |
| Poor call-time performance | Recovery rate for calls made 12–14:00 < half of 10–12:00 | `change-call-time-window` |
| Escalation rate spike | Stage escalation rate > 2× funnel average | `escalation-threshold-adjustment` |
| Pending objections queue growing | 10+ pending unreviewed objections | Admin alert: review queue |

**Implementation tasks:**
- [ ] `SuggestionEngine` runs after each model retraining and on weekly cron
- [ ] `GET /api/suggestions?funnelId=&status=pending` — list suggestions for admin
- [ ] `PATCH /api/suggestions/:id/accept` — mark accepted; optionally open related config screen
- [ ] `PATCH /api/suggestions/:id/dismiss` — mark dismissed with optional reason
- [ ] Dashboard badge: count of pending high-impact suggestions

---

## Real-Time Admin Suggestions

While an admin views a live active call transcript, surface real-time hints:

```
[HINT] Customer mentioned "interest rate" — consider steering to interest-rate objection script.
[HINT] Call at turn 8/12 — agent approaching max turns with goal not yet achieved.
[HINT] Sentiment declining over last 3 turns — exception handling may trigger soon.
```

**Architecture:**
- Backend `GET /api/calls/:id/hints` (poll every 5 s during active call)
- Powered by the same deviation detection engine as Module 8, but read-only (no intervention)
- Hints expire when call ends or are dismissed by admin

---

## Multi-Language Model Fine-Tuning

Once sufficient per-language data accumulates:

**Trigger:** ≥ 200 labelled transcripts in a specific language (e.g., Tamil `ta-IN`)

**Process:**
1. Extract language-specific training subset
2. Fine-tune sentiment lexicon for that language (replace generic weights)
3. Retrain intent-classifier patterns for language-specific phrasing
4. Evaluate language-specific model; promote if better

**Implementation tasks:**
- [ ] Language tag on all training samples
- [ ] Per-language model slots in `ModelRegistry` (`scoring-en`, `scoring-hi`, `scoring-ta`, …)
- [ ] Language auto-selection in `AssessmentModule` using `callSession.customer.language`

---

## API Enhancements for External Consumers

```
GET  /api/v2/leads                  Paginated lead list with filtering
POST /api/v2/leads/bulk             Bulk insert leads (replaces CSV upload for API consumers)
GET  /api/v2/leads/:id/timeline     Full lead history (calls, scores, objections)
GET  /api/v2/funnels/:id/stats      Funnel-level KPIs
POST /api/v2/webhooks               Register external webhook for events
DELETE /api/v2/webhooks/:id         Deregister webhook
GET  /api/v2/webhooks/:id/events    Event delivery log for a webhook
```

**Implementation tasks:**
- [ ] API versioning: `/api/v2/` prefix; v1 remains unchanged
- [ ] External webhook registry: admins register URLs to receive `call.completed`, `lead.recovered`, `lead.escalated` events
- [ ] Webhook delivery: retry up to 5 times with exponential backoff; mark failed after 24 h
- [ ] Webhook security: HMAC-SHA256 signature on every payload (same pattern as Twilio validation)
- [ ] OpenAPI spec updated for v2 endpoints

---

## Continuous Improvement Loop Summary

```
Production calls accumulate
        │
        ▼
Weekly training pipeline runs
        │
        ├──► New assessment model promoted (if better)
        ├──► Pre-call scoring model updated
        └──► Suggestion engine re-runs
                │
                ├──► New funnel suggestions queued for admin review
                └──► Real-time hints sourced from latest model
                        │
                        ▼
                Admin acts on suggestions
                        │
                        ▼
                Funnel configs updated → better conversations → better data → …
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Model AUC-ROC improvement | +0.02 per quarterly retraining | `GET /api/ml/history` |
| Conversion rate improvement | +5% MoM sustained over 6 months | `GET /api/analytics/summary` |
| Pre-call score accuracy | Top-quartile leads convert at 2× rate of bottom quartile | Cohort analysis |
| Suggestion acceptance rate | ≥ 50% of suggestions accepted by admins | Suggestion status tracking |
| Unresolved objection queue | < 20 pending items at any time | `GET /api/objections/pending` |
| System-wide escalation rate | Declining MoM | Analytics dashboard |

---

## Acceptance Criteria (Rolling, Per Quarter)

- [ ] Weekly retraining pipeline runs automatically without manual intervention
- [ ] At least one model promotion per quarter (if data threshold met)
- [ ] Pre-call scoring active; leads sorted by score in scheduler
- [ ] Funnel improvement suggestions generated for every active funnel with ≥ 30 calls
- [ ] Advanced analytics charts (cohort, heatmap, forecast) visible in UI
- [ ] Real-time hints visible in Active Calls transcript view
- [ ] External webhook delivery verified for at least one registered consumer
- [ ] API v2 documented in `/api/docs` and tested with integration tests

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Model performance plateaus | Medium | Medium | Try richer model types (gradient boosting → LLM-based); add feature engineering |
| Training data skew (easy leads disproportionate) | Medium | Medium | Stratified sampling in `TrainingDataExtractor` |
| Admin ignores suggestions | High | Low | Surface suggestions in dashboard badge; weekly digest email |
| Webhook consumer reliability | Medium | Low | Delivery log visible to admin; retry + timeout ensures no indefinite blocking |
| Gradual data distribution shift | Medium | High | Monitor training metrics quarterly; detect concept drift via PSI (Population Stability Index) |
