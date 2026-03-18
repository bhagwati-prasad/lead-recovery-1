import * as auth from '../auth.js';
import * as notifications from '../ui/notifications.js';
import { collectFormValues } from '../ui/forms.js';
import { el } from '../utils/utility.js';
import { sanitize } from '../utils/security.js';

export function renderAccountView() {
  const user = auth.isAuthenticated() ? JSON.parse(sessionStorage.getItem('lr.user') || '{}') : null;
  const root = el('section', 'view');
  root.innerHTML = `
    <h2 class="section-title">User Account</h2>
    <form id="accountForm">
      <label>Name</label><input name="name" value="${sanitize(String(user?.name || ''))}" />
      <label>Email</label><input name="email" value="${sanitize(String(user?.email || ''))}" />
      <label>Preferred language</label><input name="language" value="en-IN" />
      <label>Timezone</label><input name="timezone" value="Asia/Kolkata" />
      <div class="form-actions">
        <button type="submit">Save</button>
        <button id="logoutBtn" class="ghost" type="button">Logout</button>
      </div>
    </form>
  `;

  const form = root.querySelector('#accountForm');
  const logoutBtn = root.querySelector('#logoutBtn');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = collectFormValues(form);
    notifications.show({ type: 'success', message: `Saved profile for ${sanitize(String(values.name || ''))}` });
  });

  logoutBtn.addEventListener('click', () => {
    auth.logout();
    notifications.show({ type: 'info', message: 'Signed out' });
    window.location.hash = '#/login';
  });

  return { element: root };
}
