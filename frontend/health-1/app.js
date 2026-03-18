const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const moduleSelect = document.getElementById('moduleId');
const moduleInput = document.getElementById('moduleInput');
const executionContext = document.getElementById('executionContext');
const responseBox = document.getElementById('responseBox');

const healthButton = document.getElementById('btnHealth');
const loadModulesButton = document.getElementById('btnLoadModules');
const executeButton = document.getElementById('btnExecute');
const simulateButton = document.getElementById('btnSimulate');

const FALLBACK_MODULES = ['customer-data-retrieval', 'customer-context-acquisition'];

function getBaseUrl() {
  return apiBaseUrlInput.value.replace(/\/$/, '');
}

function renderResponse(label, payload) {
  responseBox.textContent = `${label}\n\n${JSON.stringify(payload, null, 2)}`;
}

function readJson(text, fieldName) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fieldName} must be valid JSON.`);
  }
}

async function requestJson(path, init) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...(init && init.headers ? init.headers : {}),
    },
    ...init,
  });

  const responseText = await response.text();
  const data = responseText.length > 0 ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function setModuleOptions(modules) {
  moduleSelect.innerHTML = '';
  modules.forEach((moduleId) => {
    const option = document.createElement('option');
    option.value = moduleId;
    option.textContent = moduleId;
    moduleSelect.appendChild(option);
  });
}

async function loadModules() {
  try {
    const result = await requestJson('/workflow/modules', { method: 'GET' });
    const modules = Array.isArray(result.modules)
      ? result.modules.map((entry) => entry.id).filter((entry) => typeof entry === 'string')
      : [];

    if (modules.length > 0) {
      setModuleOptions(modules);
      renderResponse('Loaded workflow modules', result);
      return;
    }

    setModuleOptions(FALLBACK_MODULES);
    renderResponse('No modules returned, using fallback module IDs', FALLBACK_MODULES);
  } catch (error) {
    setModuleOptions(FALLBACK_MODULES);
    renderResponse('Load modules failed, using fallback IDs', { error: error.message });
  }
}

healthButton.addEventListener('click', async () => {
  try {
    const result = await requestJson('/health', { method: 'GET' });
    renderResponse('Health response', result);
  } catch (error) {
    renderResponse('Health check failed', { error: error.message });
  }
});

loadModulesButton.addEventListener('click', async () => {
  await loadModules();
});

executeButton.addEventListener('click', async () => {
  try {
    const inputPayload = readJson(moduleInput.value, 'Module Input');
    const contextPayload = readJson(executionContext.value, 'Execution Context');

    const requestBody = {
      moduleId: moduleSelect.value,
      input: inputPayload,
      context: contextPayload,
    };

    const result = await requestJson('/workflow/execute', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    renderResponse('Module execution response', result);
  } catch (error) {
    renderResponse('Module execution failed', { error: error.message });
  }
});

simulateButton.addEventListener('click', async () => {
  try {
    const inputPayload = readJson(moduleInput.value, 'Module Input');
    const leadId = typeof inputPayload.leadId === 'string' && inputPayload.leadId.trim().length > 0
      ? inputPayload.leadId
      : 'lead_001';

    const scriptedUtterances = [
      'I did not receive otp',
      'yes, continue',
    ];

    const result = await requestJson('/workflow/simulate-call', {
      method: 'POST',
      body: JSON.stringify({
        leadId,
        scriptedCustomerUtterances: scriptedUtterances,
      }),
    });

    renderResponse('Phase 2 simulated call response', result);
  } catch (error) {
    renderResponse('Phase 2 simulation failed', { error: error.message });
  }
});

void loadModules();
