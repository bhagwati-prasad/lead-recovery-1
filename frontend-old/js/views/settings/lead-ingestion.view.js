export function renderLeadIngestionSection(root) {
  root.innerHTML = `
    <h3>Lead Ingestion</h3>
    <label>Endpoint URL</label>
    <input value="https://example.com/leads" />
    <label>Auth method</label>
    <select><option>API key</option><option>OAuth2</option></select>
    <label>Mapping</label>
    <textarea>{\n  \"name\": \"full_name\",\n  \"phone\": \"mobile\"\n}</textarea>
    <label>Webhook secret</label>
    <input value="••••••••••••" />
    <div class="form-actions">
      <button>Rotate secret</button>
      <button class="ghost">Test webhook</button>
    </div>
  `;
}
