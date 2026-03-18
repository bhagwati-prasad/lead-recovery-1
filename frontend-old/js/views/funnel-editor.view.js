import * as api from '../data/api.js';
import * as notifications from '../ui/notifications.js';
import { el } from '../utils/utility.js';
import { sanitize } from '../utils/security.js';

export function renderFunnelEditorView(context) {
  const root = el('section', 'view');
  const id = sanitize(String(context.params.id || ''));
  root.innerHTML = `
    <h2 class="section-title">Funnel Editor - ${id}</h2>
    <p class="muted">Drag cards to reorder stages. Use save to persist changes.</p>
    <div class="stage-list" id="stageList"></div>
    <div class="form-actions">
      <button id="addStageBtn" class="ghost">Add Stage</button>
      <button id="saveStagesBtn">Save</button>
    </div>
  `;

  const stageList = root.querySelector('#stageList');
  const saveStagesBtn = root.querySelector('#saveStagesBtn');
  const addStageBtn = root.querySelector('#addStageBtn');

  let stages = [];
  let dragIndex = -1;

  function renderStages() {
    stageList.replaceChildren();
    stages.forEach((stage, index) => {
      const card = document.createElement('lr-stage-card');
      card.dataset.index = String(index);
      card.innerHTML = `
        <strong>${sanitize(String(stage.title || ''))}</strong>
        <p class="muted">Goal: ${sanitize(String(stage.goal || ''))}</p>
        <label>Objections</label>
        <textarea data-objections="${index}">${sanitize(Array.isArray(stage.objections) ? stage.objections.join('\n') : '')}</textarea>
      `;

      card.addEventListener('dragstart', () => {
        dragIndex = index;
      });
      card.addEventListener('dragover', (event) => event.preventDefault());
      card.addEventListener('drop', () => {
        if (dragIndex < 0 || dragIndex === index) {
          return;
        }
        const moved = stages[dragIndex];
        stages.splice(dragIndex, 1);
        stages.splice(index, 0, moved);
        renderStages();
      });

      stageList.append(card);
    });
  }

  void api.getFunnels().then((funnels) => {
    const list = Array.isArray(funnels) ? funnels : funnels.items || [];
    const funnel = list.find((entry) => entry.id === id);
    const base = funnel?.stages || ['Intro', 'Qualify', 'Close'];
    stages = base.map((title) => ({ title, goal: `Complete ${title}`, objections: [] }));
    renderStages();
  });

  addStageBtn.addEventListener('click', () => {
    stages.push({ title: `Stage ${stages.length + 1}`, goal: 'Define goal', objections: [] });
    renderStages();
  });

  saveStagesBtn.addEventListener('click', async () => {
    stageList.querySelectorAll('textarea').forEach((node) => {
      const idx = Number(node.dataset.objections);
      stages[idx].objections = node.value.split('\n').map((entry) => entry.trim()).filter(Boolean);
    });
    await api.saveFunnel(id, { stages });
    notifications.show({ type: 'success', message: 'Funnel saved successfully' });
  });

  return { element: root };
}
