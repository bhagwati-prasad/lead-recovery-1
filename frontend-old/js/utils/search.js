export function search(query, entities, fields) {
  if (!query) {
    return entities;
  }
  const q = query.toLowerCase();
  return entities.filter((item) => {
    return fields.some((field) => {
      const value = String(item[field] || '').toLowerCase();
      return value.includes(q);
    });
  });
}

export function filterByRange(items, field, min, max) {
  return items.filter((item) => {
    const value = Number(item[field]);
    if (Number.isNaN(value)) {
      return false;
    }
    if (typeof min === 'number' && value < min) {
      return false;
    }
    if (typeof max === 'number' && value > max) {
      return false;
    }
    return true;
  });
}
