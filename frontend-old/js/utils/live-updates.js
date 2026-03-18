export function createPollingTask({ intervalMs, task }) {
  let timer = null;
  let inFlight = false;

  async function run() {
    if (inFlight) {
      return;
    }
    inFlight = true;
    try {
      await task();
    } finally {
      inFlight = false;
    }
  }

  return {
    async trigger() {
      await run();
    },
    start() {
      if (timer !== null) {
        return;
      }
      timer = window.setInterval(() => {
        void run();
      }, intervalMs);
    },
    stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
  };
}

export function createSseSubscription({ url, eventName = 'message', onMessage, onOpen, onError }) {
  const source = new EventSource(url, { withCredentials: true });

  const handler = (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      onMessage(data);
    } catch {
      // Ignore malformed events and keep stream alive.
    }
  };

  source.addEventListener(eventName, handler);
  source.onopen = () => {
    if (typeof onOpen === 'function') {
      onOpen();
    }
  };

  source.onerror = () => {
    if (typeof onError === 'function') {
      onError();
    }
  };

  return {
    close() {
      source.removeEventListener(eventName, handler);
      source.close();
    },
  };
}
