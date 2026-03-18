import * as api from '../../data/api.js';
import * as notifications from '../../ui/notifications.js';
import { collectFormValues, validateRequired } from '../../ui/forms.js';
import { el } from '../../utils/utility.js';

export function renderMakeCallView() {
  const root = el('section', 'view');
  root.innerHTML = `
    <h2 class="section-title">Make Call</h2>
    <form id="makeCallForm">
      <label>Customer Phone</label>
      <input name="phone" placeholder="+91xxxxxxxxxx" />
      <label>Funnel</label>
      <select name="funnel">
        <option value="renewal">Renewal Recovery</option>
        <option value="loan">Loan Reactivation</option>
      </select>
      <label>Stage</label>
      <input name="stage" value="Intro" />
      <label>Optional note</label>
      <textarea name="note"></textarea>
      <div id="makeCallErrors" class="field-error"></div>
      <div class="form-actions">
        <button type="submit">Initiate Call</button>
      </div>
    </form>
  `;

  const form = root.querySelector('#makeCallForm');
  const errorsBox = root.querySelector('#makeCallErrors');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = collectFormValues(form);
    const errors = validateRequired(values, ['phone', 'funnel', 'stage']);
    if (Object.keys(errors).length > 0) {
      errorsBox.textContent = 'Phone, funnel, and stage are required.';
      return;
    }
    errorsBox.textContent = '';
    const result = await api.makeCall(values);
    notifications.show({ type: 'success', message: `Call initiated (${result.id})` });
  });

  return { element: root };
}
