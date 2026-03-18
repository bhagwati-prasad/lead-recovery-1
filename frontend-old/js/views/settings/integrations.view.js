import * as api from '../../data/api.js';

export function renderIntegrationsSection(root) {
  root.innerHTML = `
    <h3>Integrations</h3>
    <div class="panel-row three" id="integrationCards">
      <p class="muted">Loading integrations…</p>
    </div>
  `;
  const cards = root.querySelector('#integrationCards');
  const surfaceById = new Map();

  const knownLabels = {
    'sarvam-ai': 'Sarvam AI',
    'eleven-labs': 'Eleven Labs',
    'twilio': 'Twilio',
    'exotel': 'Exotel',
    'crm': 'CRM',
  };

  const defaultChecksByIntegration = {
    'sarvam-ai': [{ id: 'credentials', title: 'Credentials present' }],
    'eleven-labs': [{ id: 'credentials', title: 'Credentials present' }],
    twilio: [
      { id: 'credentials', title: 'Credentials present' },
      { id: 'client', title: 'Twilio client auth check' },
    ],
    exotel: [{ id: 'credentials', title: 'Credentials present' }],
    crm: [{ id: 'credentials', title: 'Adapter configured' }],
  };

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeChecks(integrationId, checks) {
    const defaults = asArray(defaultChecksByIntegration[integrationId]);
    const incoming = asArray(checks);
    const byId = new Map(incoming.map((check) => [check.id, check]));

    if (defaults.length === 0 && incoming.length > 0) {
      return incoming;
    }

    return defaults.map((item) => ({
      id: item.id,
      title: item.title,
      ok: null,
      message: '',
      ...(byId.get(item.id) ?? {}),
    }));
  }

  function withSurfaceState(integration) {
    const checks = normalizeChecks(integration.id, integration.checks).map((check) => {
      if (check.id === 'credentials' && check.ok === null && typeof integration.configured === 'boolean') {
        return {
          ...check,
          ok: integration.configured,
          message: integration.message ?? check.message,
        };
      }

      return check;
    });

    if (checks.length === 0 && typeof integration.configured === 'boolean') {
      checks.push({
        id: 'credentials',
        title: 'Credentials present',
        ok: integration.configured,
        message: integration.message ?? '',
      });
    }

    return checks;
  }

  function checkIcon(ok) {
    if (ok === true) return '&#10003;';
    if (ok === false) return '&#10007;';
    return '&#9203;';
  }

  function checkIconClass(ok) {
    if (ok === true) return 'integration-check-icon pass';
    if (ok === false) return 'integration-check-icon fail';
    return 'integration-check-icon wait';
  }

  function renderChecks(integrationId, checks) {
    const list = normalizeChecks(integrationId, checks);
    if (list.length === 0) return '';

    return `
      <ul class="integration-check-list" data-check-list="${integrationId}">
        ${list
          .map(
            (check) => `
            <li class="integration-check-item" data-check-id="${check.id}">
              <span class="${checkIconClass(check.ok)}">${checkIcon(check.ok)}</span>
              <span class="integration-check-title">${check.title}</span>
            </li>`,
          )
          .join('')}
      </ul>
    `;
  }

  function renderCards(integrations) {
    cards.innerHTML = integrations
      .map(
        ({ id, label, checks }) => `
        <div class="metric" data-integration="${id}">
          <h4>${label ?? knownLabels[id] ?? id}</h4>
          <div class="integration-checks">${renderChecks(id, checks)}</div>
          <button class="ghost" data-test="${id}">Test connection</button>
        </div>`,
      )
      .join('');
  }

  // Fallback: render static cards if the API is unavailable
  function renderFallbackCards() {
    const ids = Object.keys(knownLabels);
    renderCards(ids.map((id) => ({ id, label: knownLabels[id], checks: [] })));
  }

  function paintCheckStates(card, integrationId, checks) {
    const checksContainer = card?.querySelector('.integration-checks');
    if (!checksContainer) return;
    checksContainer.innerHTML = renderChecks(integrationId, checks);
  }

  api.getIntegrations().then((integrations) => {
    if (!Array.isArray(integrations) || integrations.length === 0) {
      renderFallbackCards();
    } else {
      const hydrated = integrations.map((integration) => {
        const withChecks = {
          ...integration,
          checks: withSurfaceState(integration),
        };
        surfaceById.set(integration.id, withChecks);
        return withChecks;
      });
      renderCards(hydrated);
    }
  });

  cards.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.test) return;

    const id = target.dataset.test;
    const card = target.closest('[data-integration]');
    if (!card) return;

    target.disabled = true;
    const currentSurface = surfaceById.get(id);
    paintCheckStates(card, id, normalizeChecks(id, currentSurface?.checks));

    const result = await api.testIntegration(id);

    target.disabled = false;
    paintCheckStates(card, id, normalizeChecks(id, result.checks));
  });
}

