import * as auth from '../auth.js';
import * as notifications from '../ui/notifications.js';
import { collectFormValues, validateRequired } from '../ui/forms.js';
import { el } from '../utils/utility.js';

export function renderLoginView() {
  const root = el('section', 'view');
  root.innerHTML = `
    <h2 class="section-title">Sign in</h2>
    <p class="muted">Use admin@company.com for admin routes in this demo.</p>
    <form id="loginForm">
      <label>Email</label>
      <input name="email" type="email" placeholder="admin@company.com" />
      <label>Password</label>
      <input name="password" type="password" placeholder="••••••••" />
      <div id="loginErrors" class="field-error"></div>
      <div class="form-actions">
        <button type="submit">Login</button>
      </div>
    </form>
  `;

  const form = root.querySelector('#loginForm');
  const errorsBox = root.querySelector('#loginErrors');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = collectFormValues(form);
    const errors = validateRequired(values, ['email', 'password']);
    if (Object.keys(errors).length > 0) {
      errorsBox.textContent = 'Email and password are required.';
      return;
    }
    try {
      await auth.login(values.email, values.password);
      notifications.show({ type: 'success', message: 'Logged in successfully' });
      window.location.hash = '#/';
    } catch (error) {
      errorsBox.textContent = error.message;
    }
  });

  return { element: root };
}
