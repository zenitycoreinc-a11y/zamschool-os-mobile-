import { getMyProfileWithDetails } from './profileService.js';

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toMillis(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function inferAttendanceStudentId(notification, children = []) {
  const haystack = normalizeText(`${notification?.title || ''} ${notification?.message || ''}`);
  if (!haystack) return null;

  const matches = (children || []).filter((child) => {
    const displayName = normalizeText(child?.displayName);
    const admissionNumber = normalizeText(child?.admissionNumber);
    return (
      (displayName && haystack.includes(displayName)) ||
      (admissionNumber && haystack.includes(admissionNumber))
    );
  });

  if (matches.length !== 1) return null;
  return matches[0].id || null;
}

function normalizeNotificationItem(row, children) {
  const isAttendance = String(row?.type || '').toLowerCase() === 'attendance';
  return {
    id: row?.id || `notification-${Math.random()}`,
    source: 'notification',
    type: String(row?.type || 'general').toLowerCase(),
    title: row?.title || 'Notification',
    body: row?.message || row?.body || '',
    timestamp: row?.created_at || new Date().toISOString(),
    status: row?.is_read ? 'read' : 'unread',
    navigation: {
      route: isAttendance ? 'attendance' : null,
      studentId: isAttendance ? inferAttendanceStudentId(row, children) : null,
    },
  };
}

function normalizeAnnouncementItem(row) {
  return {
    id: row?.id || `announcement-${Math.random()}`,
    source: 'announcement',
    type: 'announcement',
    title: row?.title || 'Announcement',
    body: row?.content || row?.body || '',
    timestamp: row?.created_at || row?.published_at || new Date().toISOString(),
    status: 'read',
    navigation: {
      route: null,
      studentId: null,
    },
  };
}

function normalizeEventItem(row) {
  return {
    id: row?.id || `event-${Math.random()}`,
    source: 'event',
    type: 'event',
    title: row?.title || 'Event',
    body: row?.description || row?.body || '',
    timestamp: row?.start_date || row?.created_at || new Date().toISOString(),
    status: 'read',
    navigation: {
      route: null,
      studentId: null,
    },
  };
}

export function normalizeParentInboxItems({
  notifications = [],
  announcements = [],
  events = [],
  children = [],
} = {}) {
  return [
    ...notifications.map((row) => normalizeNotificationItem(row, children)),
    ...announcements.map((row) => normalizeAnnouncementItem(row)),
    ...events.map((row) => normalizeEventItem(row)),
  ].sort((left, right) => toMillis(right.timestamp) - toMillis(left.timestamp));
}

export function getUnreadParentNotificationIds(items = []) {
  return (items || [])
    .filter((item) => item?.source === 'notification' && item?.status === 'unread')
    .map((item) => item.id)
    .filter(Boolean);
}

async function loadNotifications(client, userId, schoolId, limit) {
  if (!userId || !schoolId) return [];

  const { data, error } = await client
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function loadAnnouncements(client, schoolId, limit) {
  if (!schoolId) return [];

  const { data, error } = await client
    .from('announcements')
    .select('id, title, content, body, target_role, created_at, published_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).filter((row) => {
    const targetRole = String(row?.target_role || '').trim().toLowerCase();
    return !targetRole || targetRole === 'parent';
  });
}

async function loadEvents(client, schoolId, limit) {
  if (!schoolId) return [];

  const { data, error } = await client
    .from('events')
    .select('id, title, description, start_date, created_at')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function loadLinkedChildren(requestFn) {
  const payload = await requestFn('/api/parent/children');
  return payload?.data || [];
}

export async function listParentInboxItems({ requestFn, client, limit = 50 } = {}) {
  const resolvedClient = client || (await requireSupabaseClient());
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const profile = await getMyProfileWithDetails(resolvedClient);
  const {
    data: { user },
    error: userError,
  } = await resolvedClient.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const [childrenResult, notificationsResult, announcementsResult, eventsResult] =
    await Promise.allSettled([
      loadLinkedChildren(resolvedRequestFn),
      loadNotifications(resolvedClient, user.id, profile?.schoolId || null, limit),
      loadAnnouncements(resolvedClient, profile?.schoolId || null, limit),
      loadEvents(resolvedClient, profile?.schoolId || null, limit),
    ]);

  const children = childrenResult.status === 'fulfilled' ? childrenResult.value : [];
  const notifications =
    notificationsResult.status === 'fulfilled' ? notificationsResult.value : [];
  const announcements =
    announcementsResult.status === 'fulfilled' ? announcementsResult.value : [];
  const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];

  if (
    childrenResult.status === 'rejected' &&
    notificationsResult.status === 'rejected' &&
    announcementsResult.status === 'rejected' &&
    eventsResult.status === 'rejected'
  ) {
    throw childrenResult.reason;
  }

  return normalizeParentInboxItems({
    notifications,
    announcements,
    events,
    children,
  });
}

export async function markParentNotificationRead(notificationId, clientOverride) {
  if (!notificationId) return;
  const client = clientOverride || (await requireSupabaseClient());
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) return;

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function markAllParentNotificationsRead(notificationIds, clientOverride) {
  const ids = Array.from(new Set((notificationIds || []).filter(Boolean)));
  if (ids.length === 0) return;
  const client = clientOverride || (await requireSupabaseClient());
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) return;

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) throw error;
}
