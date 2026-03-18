export function renderSecuritySection(root) {
  root.innerHTML = `
    <h3>Security</h3>
    <div class="panel-row two">
      <div class="metric">
        <h4>User Management</h4>
        <p class="muted">Invite users, assign roles, deactivate accounts.</p>
        <button>Invite user</button>
      </div>
      <div class="metric">
        <h4>Audit Log</h4>
        <p class="muted">Showing last 100 actions.</p>
        <button class="ghost">Refresh</button>
      </div>
    </div>
  `;
}
