import {
  invalidateReadMostlyCache,
  peekReadMostlyCacheValue,
  readThroughReadMostlyCache,
} from './readMostlyCache.js';

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function normalizeAnnouncementRow(row) {
  return {
    ...row,
    body: row?.body || row?.content || '',
    content: row?.content || row?.body || '',
  };
}

function buildAnnouncementCacheKey(limit = 30) {
  return `announcements:${String(limit || 30)}`;
}

export async function listAnnouncements(limit = 30, requestFn) {
  const safeLimit = String(limit || 30);
  return readThroughReadMostlyCache(buildAnnouncementCacheKey(safeLimit), async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn(
      `/api/account/announcements?limit=${encodeURIComponent(safeLimit)}`
    );
    return (payload?.data || []).map(normalizeAnnouncementRow);
  });
}

export function peekAnnouncements(limit = 30) {
  return peekReadMostlyCacheValue(buildAnnouncementCacheKey(limit));
}

export async function createAnnouncement(payload, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const { title, body, content, targetRole, targetClassId, isPinned, expiresAt } = payload || {};
  const response = await resolvedRequestFn('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: String(title || '').trim(),
      content: String(content || body || '').trim(),
      targetRole: targetRole || null,
      targetClassId: targetClassId || null,
      isPinned: isPinned === true,
      expiresAt: expiresAt || null,
    }),
  });

  invalidateReadMostlyCache('announcements:');
  return normalizeAnnouncementRow(response?.data || response);
}
