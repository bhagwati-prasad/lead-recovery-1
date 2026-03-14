import { el } from '../utils/utility.js';
import { renderIntegrationsSection } from './settings/integrations.view.js';
import { renderSchedulingSection } from './settings/scheduling.view.js';
import { renderLeadIngestionSection } from './settings/lead-ingestion.view.js';
import { renderSecuritySection } from './settings/security.view.js';
import { sanitize } from '../utils/security.js';

const tabs = [
  { id: 'integrations', label: 'Integrations' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'lead-ingestion', label: 'Lead Ingestion' },
  { id: 'security', label: 'Security' },
];

export function renderSettingsView(context) {
  const section = context.params.section || 'integrations';
  const root = el('section', 'view');
  root.innerHTML = `
    <h2 class="section-title">Settings</h2>
    <div class="settings-grid">
      <div id="settingsNav"></div>
      <div id="settingsContent" class="metric"></div>
    </div>
  `;

  const nav = root.querySelector('#settingsNav');
  const content = root.querySelector('#settingsContent');

  nav.innerHTML = tabs
    .map((tab) => `<a href="#/settings/${sanitize(tab.id)}" class="side-link ${tab.id === section ? 'active' : ''}">${sanitize(tab.label)}</a>`)
    .join('');

  if (section === 'scheduling') {
    renderSchedulingSection(content);
  } else if (section === 'lead-ingestion') {
    renderLeadIngestionSection(content);
  } else if (section === 'security') {
    renderSecuritySection(content);
  } else {
    renderIntegrationsSection(content);
  }

  return { element: root };
}
