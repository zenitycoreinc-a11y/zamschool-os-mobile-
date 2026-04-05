import { requireSupabase } from './supabase.js';

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

const BELL_GROUPS = [
  { key: 'school', label: 'School' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'app', label: 'App' },
];
const listeners = new Set();

export async function getMyUnreadSummary(requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn('/api/account/unread-summary');
  return {
    notifications: Number(payload?.data?.notifications || 0),
    messages: Number(payload?.data?.messages || 0),
  };
}

export async function listMyNotifications(limit = 50) {
  const resolvedRequestFn = await getApiRequest();
  const payload = await resolvedRequestFn(
    `/api/account/notifications?limit=${encodeURIComponent(String(limit || 50))}`
  );
  return payload?.data || [];
}

export function groupNotificationsForBell(items = []) {
  const grouped = BELL_GROUPS.map((group) => ({ ...group, items: [] }));

  for (const item of items || []) {
    const key = resolveBellGroupKey(item);
    const bucket = grouped.find((group) => group.key === key) || grouped[0];
    bucket.items.push(item);
  }

  return grouped.filter((group) => group.items.length > 0);
}

export function countUnreadNotifications(items = []) {
  return (items || []).filter((item) => !item?.is_read).length;
}

export function subscribeToNotificationUpdates(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function markMyNotificationRead(notificationId) {
  if (!notificationId) {
    return;
  }

  const client = await requireSupabase();
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();

  if (userErr) throw userErr;
  if (!user) return;

  const queryAttempts = [
    () => client.from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', user.id),
    () =>
      client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', user.id),
  ];

  let lastError = null;
  for (const runQuery of queryAttempts) {
    const { error } = await runQuery();
    if (!error) {
      emitNotificationStateChanged();
      return;
    }
    lastError = error;
  }

  if (lastError) {
    throw lastError;
  }
}

function resolveBellGroupKey(item) {
  const type = String(item?.type || '').trim().toLowerCase();

  if (type === 'app' || type === 'system' || type === 'security') {
    return 'app';
  }

  if (
    type === 'attendance' ||
    type === 'exam_result' ||
    type === 'low_attendance' ||
    type === 'teacher' ||
    type === 'teacher_message' ||
    type === 'assignment'
  ) {
    return 'teacher';
  }

  return 'school';
}

function emitNotificationStateChanged() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Keep notification updates best-effort.
    }
  }
}
