export function validateRequired(values, requiredFields) {
  const errors = {};
  requiredFields.forEach((field) => {
    if (!String(values[field] || '').trim()) {
      errors[field] = 'Required';
    }
  });
  return errors;
}

export function collectFormValues(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}
