export function renderSchedulingSection(root) {
  root.innerHTML = `
    <h3>Scheduling</h3>
    <label>Call hours</label>
    <lr-time-picker></lr-time-picker>
    <label>Max call attempts</label>
    <input value="5" />
    <label>Retry interval (minutes)</label>
    <input value="60" />
    <label>Timezone</label>
    <input value="Asia/Kolkata" />
    <p class="muted">Preview: leads will be called between 09:00 and 19:00 in Asia/Kolkata.</p>
  `;
}
