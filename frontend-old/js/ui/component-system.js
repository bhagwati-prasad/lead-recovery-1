import { sanitize } from '../utils/security.js';

class MetricCard extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute('label') || 'Metric';
    const value = this.getAttribute('value') || '0';
    const trend = this.getAttribute('trend') || '0%';
    this.innerHTML = `<div class=\"metric\"><div class=\"muted\">${sanitize(label)}</div><div style=\"font-size:1.4rem;font-weight:700;\">${sanitize(value)}</div><div class=\"muted\">${sanitize(trend)}</div></div>`;
  }
}

class Badge extends HTMLElement {
  connectedCallback() {
    const tone = this.getAttribute('tone') || 'ok';
    this.classList.add('badge', tone);
  }
}

class Toast extends HTMLElement {
  connectedCallback() {
    const type = this.getAttribute('data-type') || 'info';
    const label = type.toUpperCase();
    this.innerHTML = `<strong>${label}</strong> ${sanitize(this.textContent || '')}`;
  }
}

class FileUpload extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<label>Upload leads</label><input type=\"file\" accept=\".csv,.json,.xlsx\" />`;
    const input = this.querySelector('input');
    input?.addEventListener('change', () => {
      const file = input.files && input.files[0] ? input.files[0] : null;
      this.dispatchEvent(new CustomEvent('file.selected', { detail: file, bubbles: true }));
    });
  }
}

class SearchInput extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<input type="search" placeholder="Search" />';
    const input = this.querySelector('input');
    let timer;
    input?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.dispatchEvent(new CustomEvent('search.change', { detail: input.value, bubbles: true }));
      }, 180);
    });
  }
}

class StageCard extends HTMLElement {
  connectedCallback() {
    this.draggable = true;
    this.classList.add('stage-card');
  }
}

class Transcript extends HTMLElement {
  connectedCallback() {
    this.classList.add('transcript-box');
  }
}

class AudioPlayer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<audio controls preload="none"></audio>';
  }
}

class DataTable extends HTMLElement {}
class Modal extends HTMLElement {}
class Drawer extends HTMLElement {}
class Sparkline extends HTMLElement {}
class TimePicker extends HTMLElement {}

const registry = [
  ['lr-metric-card', MetricCard],
  ['lr-sparkline', Sparkline],
  ['lr-data-table', DataTable],
  ['lr-modal', Modal],
  ['lr-drawer', Drawer],
  ['lr-file-upload', FileUpload],
  ['lr-stage-card', StageCard],
  ['lr-search-input', SearchInput],
  ['lr-time-picker', TimePicker],
  ['lr-badge', Badge],
  ['lr-toast', Toast],
  ['lr-transcript', Transcript],
  ['lr-audio-player', AudioPlayer],
];

export function init() {
  registry.forEach(([tag, klass]) => {
    if (!customElements.get(tag)) {
      customElements.define(tag, klass);
    }
  });
}
