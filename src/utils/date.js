export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return 'n/a';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}
