import * as http from '../http.js';

const fallback = {
  summary: {
    today: { total: 38, answered: 27, recovered: 11, escalated: 4, failed: 12 },
    weeklyRate: 0.32,
    pendingEscalations: 4,
    pendingObjections: 7,
    apiLatencyMs: 420,
    uptime: 99.4,
    recent: [
      'Call recovered for lead-133',
      'Escalation created for lead-144',
      'New leads imported: 42',
    ],
  },
  customers: [
    { id: 'c-101', name: 'Asha Nair', phone: '+91-9988776655', status: 'warm', score: 0.72 },
    { id: 'c-102', name: 'Rahul Das', phone: '+91-9966554433', status: 'cold', score: 0.33 },
    { id: 'c-103', name: 'Mina Shah', phone: '+91-9900112233', status: 'hot', score: 0.84 },
  ],
  funnels: [
    { id: 'f-1', product: 'Insurance', name: 'Renewal Recovery', active: true, stages: ['Intro', 'OTP', 'Close'] },
    { id: 'f-2', product: 'Loans', name: 'Loan Reactivation', active: true, stages: ['Intro', 'Qualify', 'Offer', 'Close'] },
  ],
  activeCalls: [
    { id: 'call-11', customer: 'Asha Nair', funnel: 'Renewal Recovery', stage: 'OTP', status: 'active', durationSec: 84 },
  ],
  callLog: [
    { id: 'call-01', customer: 'Mina Shah', outcome: 'recovered', stage: 'Close', at: '2026-03-12T10:15:00Z' },
    { id: 'call-02', customer: 'Rahul Das', outcome: 'failed', stage: 'Intro', at: '2026-03-12T11:42:00Z' },
  ],
  agents: [
    { id: 'ag-1', name: 'Maya Hindi', language: 'hi-IN', voiceId: 'eleven-45', calls: 102, avgScore: 0.74, escalationRate: 0.16 },
    { id: 'ag-2', name: 'Arjun English', language: 'en-IN', voiceId: 'eleven-09', calls: 88, avgScore: 0.69, escalationRate: 0.2 },
  ],
  analytics: {
    series: [0.21, 0.24, 0.28, 0.31, 0.27, 0.33, 0.35],
    outcomes: { recovered: 42, failed: 23, escalated: 13 },
    objections: { pricing: 11, trust: 8, timing: 6 },
    dropoff: { intro: 100, qualify: 74, offer: 54, close: 31 },
    topLeads: [
      { id: 'c-103', name: 'Mina Shah', probability: 0.91 },
      { id: 'c-101', name: 'Asha Nair', probability: 0.88 },
    ],
  },
};

async function tryFetch(primary, backup) {
  try {
    return await primary();
  } catch {
    return backup;
  }
}

export function getSummary() {
  return tryFetch(() => http.get('/analytics/summary'), fallback.summary);
}

export function getCustomers() {
  return tryFetch(() => http.get('/customers'), fallback.customers);
}

export function getFunnels() {
  return tryFetch(() => http.get('/funnels'), fallback.funnels);
}

export function saveFunnel(id, payload) {
  return tryFetch(() => http.put(`/funnels/${id}`, payload), { ok: true });
}

export function getActiveCalls() {
  return tryFetch(() => http.get('/calls/active'), fallback.activeCalls);
}

export function getTranscript(callId) {
  return tryFetch(() => http.get(`/calls/${callId}/transcript`, { skipCache: true }), {
    lines: [
      'Agent: Hello, this is Lead Recovery support.',
      'Customer: I could not complete the flow yesterday.',
      'Agent: I can help you finish it now. Ready for OTP verification?',
    ],
  });
}

export function hangupCall(callId) {
  return tryFetch(() => http.post(`/calls/${callId}/hang-up`, {}), { ok: true });
}

export function getCallLog() {
  return tryFetch(() => http.get('/calls/log'), fallback.callLog);
}

export function makeCall(payload) {
  return tryFetch(() => http.post('/calls/manual', payload), { id: `call-${Date.now()}`, status: 'queued' });
}

export function getAgents() {
  return tryFetch(() => http.get('/agents'), fallback.agents);
}

export function saveAgent(payload) {
  return tryFetch(() => http.post('/agents', payload), { ok: true, id: `ag-${Date.now()}` });
}

export function getAnalytics(range) {
  return tryFetch(() => http.get(`/analytics?range=${encodeURIComponent(range || '30d')}`), fallback.analytics);
}

export function getTopLeads() {
  return tryFetch(() => http.get('/analytics/leads/top'), fallback.analytics.topLeads);
}

export function testIntegration(id) {
  return tryFetch(() => http.post(`/integrations/${id}/test`, {}), { ok: true });
}

export function uploadLeads(formData) {
  return tryFetch(
    () =>
      fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      }).then((res) => res.json()),
    { ok: true, imported: 0 }
  );
}
