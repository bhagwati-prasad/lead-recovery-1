# Phase 6 — Integration, Testing, and Optimization

**Duration:** 2 months  
**Depends on:** Phase 5 complete (all UI available; all backend endpoints implemented)  
**Unlocks:** Phase 7 (Advanced Analytics and Self-Improvement) / Production readiness

---

## Objectives

Connect all real third-party services, replace every mock adapter with a production implementation, build a comprehensive multi-layer test suite, and harden the system for the load and reliability targets in the SRS: **99% uptime**, **< 5 s response time**, support for concurrent calls across multiple funnels and products.

---

## Third-Party Integration Completion

### 1. Sarvam AI — STT (Speech-to-Text)

**Adapter:** `SarvamSTTAdapter` (stub created in Phase 2; real implementation here)

**Integration details:**
- Endpoint: Sarvam `/asr` REST API (multipart audio upload)
- Supported languages: `en-IN`, `hi-IN`, `ta-IN`, `te-IN`, `mr-IN`, `bn-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`
- Audio formats: PCM WAV 16 kHz 16-bit mono (preferred); MP3 fallback
- Response: transcript string + detected language + confidence score
- Error handling: 429 rate-limit → wait + retry; 500 → fallback to mock (log alert)

**Acceptance steps:**
- [ ] Real API key from Sarvam stored in environment variable `SARVAM_API_KEY` (never in code)
- [ ] Live transcription accuracy test: record 10 sample phrases in each target language; assert WER < 20%
- [ ] Latency test: 95th percentile < 800 ms for a 5-second audio clip
- [ ] Retry + fallback behaviour verified with simulated 429 and 500 responses

### 2. Eleven Labs — TTS (Text-to-Speech)

**Adapter:** `ElevenLabsTTSAdapter` (stub in Phase 2; real implementation here)

**Integration details:**
- Endpoint: `/v1/text-to-speech/{voiceId}` (streaming PCM or MP3)
- Voice IDs: stored per agent persona in config; fetched via `GET /v1/voices`
- Streaming: prefer chunk-streaming for low latency (start playing before full audio received)
- Cache: `AudioCache` keyed by SHA-256(text + voiceId + language); 7-day TTL
- Rate limit: respect `x-ratelimit-remaining` header; pre-emptive backoff when < 10% remaining

**Acceptance steps:**
- [ ] Real API key from Eleven Labs stored in `ELEVEN_LABS_API_KEY`
- [ ] Streaming TTS test: first audio chunk arrives within 400 ms on P95
- [ ] Cache hit rate > 40% for repeat phrases (welcome messages)
- [ ] Voice library sync: `GET /api/agents/voices/sync` fetches available voices into config

### 3. Twilio — Telephony (Primary)

**Adapter:** `TwilioTelephonyAdapter` (stub in Phase 2; real implementation here)

**Integration details:**
- Outbound calls via Twilio Programmable Voice REST API
- Audio streaming: bidirectional via Twilio Media Streams (WebSocket)
- Webhook events: `call.initiated`, `call.ringing`, `call.answered`, `call.ended`
- Webhook validation: HMAC-SHA256 signature using `X-Twilio-Signature` header (mandatory)
- DTMF support: customer can press digits as input

**Acceptance steps:**
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` from environment
- [ ] Webhook signature validation implemented and tested (reject unsigned requests)
- [ ] 10-call live test: all calls initiated, answered, and correctly hung up
- [ ] Audio streaming: agent speech received and played without noticeable gap (< 400 ms)
- [ ] Fallback: if Twilio call fails, retry after 60 s; mark lead `unreachable` after 3 failures

### 4. Exotel — Telephony (Alternative / Fallback)

**Adapter:** `ExotelTelephonyAdapter` (new in Phase 6)

Exotel is an India-market telephony provider. The Orchestrator selects between Twilio and Exotel based on `config.telephony.provider`.

- Exotel REST API for outbound calls
- Callback URL model (no long-lived WebSocket; polling alternative available)
- Audio delivery: TwiML-equivalent EXOML

**Acceptance steps:**
- [ ] Adapter implements `TelephonyAdapter` interface identically to Twilio adapter
- [ ] Orchestrator can switch between Twilio and Exotel via config with zero code change
- [ ] Integration test: 5-call test against Exotel sandbox

### 5. LLM (Gemini Adapter)

Complete the `GeminiLLMAdapter` for production:
- [ ] Configurable Gemini model selection per funnel and use case
- [ ] Model selection per funnel (cost vs. capability trade-off configurable)
- [ ] Token usage logging: `POST /api/telemetry/llm-usage` per call
- [ ] Hard ceiling: reject prompt if estimated tokens > `config.llm.maxPromptTokens` (default 4000)

### 6. Multi-Channel Stubs (SMS, Email, WhatsApp)

Not fully implemented in Phase 6, but stubs are registered so future channels can be activated via config:

```typescript
interface OutreachChannelAdapter {
  readonly channel: 'sms' | 'email' | 'whatsapp' | 'call';
  send(to: string, content: OutreachContent): Promise<void>;
  getStatus(messageId: string): Promise<'delivered' | 'failed' | 'pending'>;
}
```

- [ ] `SMSOutreachAdapter` (stub): logs message, returns mock delivery
- [ ] `EmailOutreachAdapter` (stub): SMTP implementation (nodemailer)
- [ ] `WhatsAppOutreachAdapter` (stub): Twilio WhatsApp API skeleton
- [ ] Channel selection config: `config.outreach.preferredChannel` per funnel

---

## CRM Integration

Finalise the `CRMAdapter` with at least one real implementation beyond the mock:

### Internal CRM (REST API)

```typescript
class InternalCRMAdapter implements CRMAdapter {
  // Calls internal API with configurable base URL + API key
  // Implements full interface: getCustomerById, getLeadsByFunnelStage,
  //   updateLeadStatus, getCustomerFunnelContext, createTask
}
```

- [ ] Full implementation + integration test against staging CRM
- [ ] Field mapping config: map CRM API response fields to `Customer` / `Lead` models
- [ ] Pagination: handle paginated CRM responses transparently

---

## Test Suite

### Unit Tests (Target: ≥ 80% coverage across all modules)

Verify all previous phases' unit tests still pass. Add missing coverage:

- [ ] All adapter error paths (429, 500, network timeout, malformed response)
- [ ] Orchestrator edge cases: plan with 0 runnable steps, all-optional plan
- [ ] Auth: expired JWT refresh, invalid refresh token flow
- [ ] Security: XSS sanitiser; CSRF token validation

### Integration Tests

**Backend integration test suite** (`tests/integration/`):

| Suite | Scope | Environment |
|-------|-------|-------------|
| `crm-adapter.integration.test` | Internal CRM adapter vs. staging API | Staging |
| `call-workflow.integration.test` | Modules 1–10 with real STT/TTS, mock telephony | Test |
| `orchestrator.integration.test` | All 6 fusion scenarios | Test |
| `analytics.integration.test` | Full pipeline: call → event → store → API | Test |
| `escalation.integration.test` | Exception handling → ticket → webhook | Test |

### End-to-End Tests (Playwright)

**Backend E2E** — full live call simulation:

```
Test: happy-path-call
  GIVEN a lead in 'scheduled' status
  WHEN the orchestrator runs the full workflow with Twilio mock + Sarvam mock + ElevenLabs mock
  THEN lead.status = 'recovered' AND call session transcript has ≥ 3 turns AND assessment score > 0.6
```

| E2E Scenario | Expected Outcome |
|-------------|-----------------|
| Happy path: lead recovered | `lead.status = recovered`; score ≥ 0.7 |
| Hard rejection | `lead.status = failed`; score < 0.3 |
| Customer not answering | `lead.callAttempts++`; re-scheduled |
| Escalation triggered | Ticket created; `lead.status = escalated`; webhook fired |
| TTS service down | Fallback logged; call continues without audio (text-only) |
| STT service down | Call aborts; lead rescheduled; error event emitted |
| LLM over token limit | Request rejected before call; warning logged; fallback prompt used |

**Frontend E2E** (Playwright against running backend + UI server):

| E2E Scenario | Assertions |
|-------------|------------|
| Login + view dashboard | Metrics visible; no console errors |
| Import CSV → leads appear | Leads in customer list with correct status |
| Create funnel + stages | Funnel visible in funnels list |
| Initiate manual call | Call appears in active calls; transcript updates |
| Approve pending objection | Objection appears in database; pending queue reduces |

### Load Tests

**Tool:** `k6` or `artillery` — defined as `tests/load/`

**Scenarios:**

| Scenario | Virtual Users | Duration | Pass Criteria |
|----------|-------------|----------|---------------|
| Baseline: single concurrent call | 1 | 5 min | P95 response < 5 s; 0 errors |
| Standard: 10 concurrent calls | 10 | 10 min | P95 response < 5 s; error rate < 0.1% |
| Peak: 50 concurrent calls | 50 | 5 min | P95 response < 8 s; error rate < 1% |
| API: 100 req/s on analytics endpoint | 100 req/s | 2 min | P95 < 200 ms; 0 5xx |

**Bottleneck investigation plan:**
- If LLM latency causes overrun: reduce `maxTokens` or switch to lighter model in config
- If STT latency spikes: increase Sarvam rate-limit tier; add connection pool
- If database writes become contention: evaluate batch-write for transcript entries

---

## Performance Optimizations

### Backend

- [ ] **Connection pooling:** database connections pooled (min 5, max 20); adapter HTTP clients reuse connections
- [ ] **Transcript batch writes:** buffer transcript entries in memory during call; flush to DB in one batch at call end
- [ ] **Audio cache warm-up:** pre-generate and cache welcome messages for all scheduled leads at session start
- [ ] **LLM prompt caching:** cache unchanged system prompts; only user turns change per request
- [ ] **Background task queue:** non-critical work (analytics enrichment, objection similarity search) runs in background worker; does not block call response
- [ ] **Graceful shutdown:** drain active calls before process exit; complete in-progress DB writes

### Frontend

- [ ] **Code splitting:** each view module is loaded lazily on first navigation to that route
- [ ] **Resource hints:** `<link rel="preconnect">` for API domain, Icons8 CDN
- [ ] **Service Worker:** cache static assets (JS, CSS, icons) for offline/slow-network resilience
- [ ] **Debounce:** search inputs debounced at 300 ms; prevent API floods
- [ ] **Virtual list:** confirmed working at 1000+ rows before Phase 6 sign-off

---

## Security Hardening

Based on OWASP Top 10:

| OWASP Category | Mitigation |
|----------------|-----------|
| Broken Access Control | RBAC enforced on every API endpoint; role checked server-side, not just client |
| Cryptographic Failures | PII encrypted at rest (AES-256-GCM); TLS 1.2+ for all transport |
| Injection | Parameterised queries only (no string-interpolated SQL); LLM inputs sanitised |
| Insecure Design | Threat model reviewed against all API endpoints |
| Security Misconfiguration | `NODE_ENV=production` disables debug endpoints; default-deny CORS |
| Vulnerable Components | `npm audit` in CI; block merge on critical CVEs |
| Auth Failures | JWT expiry 15 min; refresh token rotation; account lockout after 5 failures |
| Software/Data Integrity | Webhook HMAC-SHA256 validation (Twilio, webhook notifications) |
| Logging Failures | All auth events and admin actions logged; PII masked; log retention ≥ 90 days |
| SSRF | Outbound HTTP requests restricted to allowlisted domains via `OutboundURLGuard` |

**Security audit checklist:**
- [ ] `npm audit --audit-level=high` — zero high/critical findings
- [ ] All API endpoints require authentication except `/api/health` and `/login`
- [ ] Phone numbers stored encrypted; decrypted only in memory when dialling
- [ ] No secrets in git history (run `git-secrets` scan in CI)
- [ ] Penetration test (manual): test IDOR on customer/lead endpoints with two test accounts

---

## Deployment Infrastructure

```
infra/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── docker-compose.prod.yml
├── k8s/                      (optional — if scaling beyond single host)
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── ingress.yaml
└── scripts/
    ├── deploy.sh
    ├── rollback.sh
    └── db-migrate.sh
```

**Implementation tasks:**
- [ ] Production Dockerfile for backend: multi-stage NestJS build; non-root user; health check endpoint
- [ ] Nginx reverse proxy: serve frontend static files; proxy `/api` to backend; gzip compression; HTTPS redirect
- [ ] Environment variable injection: all secrets from environment, not baked into images
- [ ] Database migration on deploy: `npm run db:migrate` runs before new version starts
- [ ] Health check: `GET /api/health` returns `{ status: 'ok', version, uptime }` — used by load balancer
- [ ] Zero-downtime rolling deploy (blue/green via `docker-compose` or Kubernetes)
- [ ] Rollback: `deploy.sh --rollback` re-activates previous image tag

### Monitoring

- [ ] Uptime monitor: `GET /api/health` polled every 30 s; alert if 3 consecutive failures
- [ ] Alerting thresholds:
  - Error rate > 1% over 5 min
  - P95 response > 5 s sustained for 2 min
  - Failed call rate > 20% over 30 min
  - Disk usage > 80%
- [ ] Log aggregation: forward structured JSON logs to centralised log store
- [ ] Metrics dashboard: expose Prometheus-compatible metrics at `/metrics` (behind auth)

---

## Documentation

- [ ] **API Reference:** OpenAPI 3.1 spec auto-generated from route decorators; hosted at `/api/docs`
- [ ] **Deployment Guide:** step-by-step server setup, environment variable reference
- [ ] **Integration Guide:** how to configure each third-party adapter (Sarvam, Eleven Labs, Twilio, Exotel)
- [ ] **Admin User Guide:** walkthrough of each UI section (10-page doc with screenshots)
- [ ] **Operator Runbook:** common failure scenarios and remediation steps

---

## Acceptance Criteria

- [ ] All real adapters pass their acceptance steps above
- [ ] Full test suite: unit + integration + E2E passes with zero failures
- [ ] Load test: 10 concurrent calls with P95 < 5 s and error rate < 0.1%
- [ ] `npm audit` produces zero high/critical vulnerabilities
- [ ] IDOR penetration test: no cross-account data leakage found
- [ ] Production Docker image builds and starts successfully with valid env vars
- [ ] Health endpoint accessible and returns correct version
- [ ] Zero-downtime deploy verified: deploy new version while 2 active calls in progress; calls complete normally
- [ ] API documentation available at `/api/docs`

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sarvam / Eleven Labs API downtime during testing | Medium | High | Mock adapters ready; tests can be re-run when service recovers |
| Twilio PSTN costs during load testing | Medium | Medium | Use Twilio test credentials for load tests; only P95 validation needs real calls |
| Database write contention at 50 concurrent calls | Medium | High | Batch transcript writes; increase connection pool; benchmark early |
| Deployment rollback time too long | Low | High | Blue/green deploy; automated health check gates promotion |
| Secret leakage via environment variable logging | Low | Critical | PII masking serializer extended to environment variable names matching secret patterns |
