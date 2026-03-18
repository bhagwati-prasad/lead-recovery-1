self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ping') {
    self.postMessage({ type: 'pong', at: Date.now() });
  }
});
