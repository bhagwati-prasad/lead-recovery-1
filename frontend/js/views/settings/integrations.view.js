import * as api from '../../data/api.js';

export function renderIntegrationsSection(root) {
  root.innerHTML = `
    <h3>Integrations</h3>
    <div class="panel-row three" id="integrationCards">
      <p class="muted">Loading integrations…</p>
    </div>
  `;
  const cards = root.querySelector('#integrationCards');

  const knownLabels = {
    'sarvam-ai': 'Sarvam AI',
    'eleven-labs': 'Eleven Labs',
    'twilio': 'Twilio',
    'exotel': 'Exotel',
    'crm': 'CRM',
  };

  function statusBadge(configured) {
    return configured
      ? `<span style="color:var(--color-success,#22c55e);">&#10003; Configured</span>`
      : `<span style="color:var(--color-muted,#888);">&#x25CB; Not configured</span>`;
  }

  function renderCards(integrations) {
    cards.innerHTML = integrations
      .map(
        ({ id, label, configured, message }) => `
        <div class="metric" data-integration="${id}">
          <h4>${label ?? knownLabels[id] ?? id}</h4>
          <p class="muted status-text">${statusBadge(configured)} &mdash; ${message}</p>
          <button class="ghost" data-test="${id}">Test connection</button>
        </div>`,
      )
      .join('');
  }

  // Fallback: render static cards if the API is unavailable
  function renderFallbackCards() {
    const ids = Object.keys(knownLabels);
    renderCards(ids.map((id) => ({ id, label: knownLabels[id], configured: false, message: 'Status unavailable' })));
  }

  api.getIntegrations().then((integrations) => {
    if (!Array.isArray(integrations) || integrations.length === 0) {
      renderFallbackCards();
    } else {
      renderCards(integrations);
    }
  });

  cards.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.test) return;

    const id = target.dataset.test;
    const card = target.closest('[data-integration]');
    const statusText = card?.querySelector('.status-text');

    target.disabled = true;
    target.textContent = 'Testing…';

    const result = await api.testIntegration(id);

    target.disabled = false;
    target.textContent = 'Test connection';

    if (result.ok) {
      target.textContent = 'Test passed ✓';
      if (statusText) {
        statusText.innerHTML = `${statusBadge(true)} &mdash; ${result.message}`;
      }
    } else if (result.reason === 'not_configured') {
      target.textContent = 'Test connection';
      if (statusText) {
        statusText.innerHTML = `${statusBadge(false)} &mdash; ${result.message}`;
      }
      alert(`Integration not configured: ${result.message}`);
    } else {
      target.textContent = 'Test failed';
      if (statusText) {
        statusText.innerHTML = `<span style="color:var(--color-error,#ef4444);">&#x26A0; Error</span> &mdash; ${result.message}`;
      }
    }
  });
}

