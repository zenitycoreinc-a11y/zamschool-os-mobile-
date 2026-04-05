const allowedRoles = new Set(['admin', 'teacher', 'student', 'parent', 'payments']);

export function normalizeKnownRole(role) {
  const candidate = String(role || '').trim().toLowerCase();
  return allowedRoles.has(candidate) ? candidate : 'unknown';
}
