let container;
let sequence = 0;

export function init() {
  container = document.getElementById('toastRegion');
}

export function show({ type = 'info', message, duration = 3800 }) {
  const id = ++sequence;
  const toast = document.createElement('lr-toast');
  toast.setAttribute('data-id', String(id));
  toast.setAttribute('data-type', type);
  toast.textContent = message;
  container.prepend(toast);
  trim();
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export function persist({ type = 'error', message }) {
  return show({ type, message, duration: 0 });
}

export function dismiss(id) {
  const target = container.querySelector(`lr-toast[data-id=\"${id}\"]`);
  if (target) {
    target.remove();
  }
}

function trim() {
  const list = [...container.querySelectorAll('lr-toast')];
  list.slice(5).forEach((node) => node.remove());
}
