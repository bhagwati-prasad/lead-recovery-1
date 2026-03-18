import * as api from '../data/api.js';
import { el } from '../utils/utility.js';
import { sanitize } from '../utils/security.js';

export function renderCustomerDetailView(context) {
  const root = el('section', 'view');
  const id = sanitize(String(context.params.id || ''));
  root.innerHTML = `<h2 class="section-title">Customer Detail</h2><p class="muted">Loading profile for ${id}...</p>`;

  void api.getCustomers().then((rows) => {
    const list = Array.isArray(rows) ? rows : rows.items || [];
    const customer = list.find((entry) => entry.id === id);
    if (!customer) {
      root.innerHTML = '<h2 class="section-title">Customer Detail</h2><p>Customer not found.</p>';
      return;
    }
    root.innerHTML = `
      <h2 class="section-title">${sanitize(String(customer.name || ''))}</h2>
      <div class="panel-row two">
        <div class="metric">
          <p class="muted">Phone</p>
          <h3>${sanitize(String(customer.phone || ''))}</h3>
          <p class="muted">Status: ${sanitize(String(customer.status || ''))}</p>
          <p class="muted">Conversion score: ${sanitize(String(Math.round((customer.score || 0) * 100)))}%</p>
        </div>
        <div class="metric">
          <h3>Recent timeline</h3>
          <ul>
            <li>Lead imported</li>
            <li>Call attempted</li>
            <li>Follow-up scheduled</li>
          </ul>
        </div>
      </div>
    `;
  });

  return { element: root };
}
