import * as api from '../../data/api.js';

export function renderIntegrationsSection(root) {
  root.innerHTML = `
    <h3>Integrations</h3>
    <div class="panel-row three" id="integrationCards"></div>
  `;
  const cards = root.querySelector('#integrationCards');
  const items = ['sarvam-ai', 'eleven-labs', 'twilio', 'exotel', 'crm'];
  cards.innerHTML = items
    .map(
      (id) => `
      <div class="metric">
        <h4>${id}</h4>
        <p class="muted">Status: connected</p>
        <button class="ghost" data-test="${id}">Test connection</button>
      </div>`
    )
    .join('');

  cards.addEventListener('click', async (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.test) {
      await api.testIntegration(target.dataset.test);
      target.textContent = 'Test passed';
    }
  });
}
