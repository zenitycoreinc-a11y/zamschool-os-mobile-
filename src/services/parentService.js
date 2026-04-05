import {
  peekReadMostlyCacheValue,
  readThroughReadMostlyCache,
} from './readMostlyCache.js';

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function buildAttendanceQuery({ range = '1m', studentId = null } = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set('range', range || '1m');
  if (studentId) searchParams.set('studentId', studentId);
  return searchParams.toString();
}

function buildParentAttendanceCacheKey(options = {}) {
  return `parent:attendance:${buildAttendanceQuery(options)}`;
}

function coerceCount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function countLinkedParentStudents(links = [], parentIds = []) {
  const allowedParentIds = new Set((parentIds || []).filter(Boolean));
  const studentIds = new Set();

  for (const row of links || []) {
    if (!allowedParentIds.has(row?.parent_id) || !row?.student_id) {
      continue;
    }

    studentIds.add(row.student_id);
  }

  return studentIds.size;
}

export function pickFirstPopulatedFeeRows(results = []) {
  for (const result of results || []) {
    if (Array.isArray(result?.rows) && result.rows.length > 0) {
      return result.rows;
    }
  }

  return [];
}

function collectLinkedStudentIds(links = [], parentIds = []) {
  const allowedParentIds = new Set((parentIds || []).filter(Boolean));
  const studentIds = new Set();

  for (const row of links || []) {
    if (!allowedParentIds.has(row?.parent_id) || !row?.student_id) {
      continue;
    }

    studentIds.add(row.student_id);
  }

  return Array.from(studentIds);
}

function buildAttendanceRate(rows = []) {
  const totalAttendance = (rows || []).length;
  const presentLike = (rows || []).filter((row) =>
    ['present', 'late', 'excused', 'PRESENT', 'LATE', 'EXCUSED'].includes(String(row.status || ''))
  ).length;

  return totalAttendance > 0 ? Math.round((presentLike / totalAttendance) * 100) : null;
}

export function buildParentProgressViewModel({
  studentRows = [],
  profileRows = [],
  attendanceRows = [],
  resultsRows = [],
} = {}) {
  const profileById = new Map((profileRows || []).map((row) => [row.id, row]));
  const linkedChildren = (studentRows || []).map((student) => {
    const profile = profileById.get(student.profile_id);
    return {
      id: student.id,
      profileId: student.profile_id || null,
      name:
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || 'Student',
    };
  });

  const totalAttendance = (attendanceRows || []).length;
  const presentLike = (attendanceRows || []).filter((row) =>
    ['present', 'late', 'excused', 'PRESENT', 'LATE', 'EXCUSED'].includes(String(row.status || ''))
  ).length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentLike / totalAttendance) * 100) : null;

  const childMap = new Map(linkedChildren.map((child) => [child.id, child.name]));
  const latestResults = (resultsRows || []).slice(0, 8).map((row) => ({
    studentName: childMap.get(row.student_id) || 'Student',
    score: typeof row.score === 'number' ? row.score : Number(row.score || 0),
    createdAt: row.created_at,
  }));

  return { linkedChildren, attendanceRate, latestResults };
}

export function buildParentProgressFromApi({
  children = [],
  attendanceRows = [],
  resultsRows = [],
} = {}) {
  const linkedChildren = (children || []).map((child) => {
    const childId = child.id;
    const childAttendanceRows = (attendanceRows || []).filter(
      (row) => (row.studentId || row.student_id) === childId
    );
    const childLatestResult = (resultsRows || []).find(
      (row) => (row.studentId || row.student_id) === childId
    );

    return {
      id: childId,
      profileId: child.profileId || null,
      name: child.displayName || child.name || 'Student',
      attendanceRate: buildAttendanceRate(childAttendanceRows),
      latestResult: childLatestResult
        ? {
            score:
              typeof childLatestResult.score === 'number'
                ? childLatestResult.score
                : Number(childLatestResult.score || 0),
            createdAt:
              childLatestResult.publishedAt ||
              childLatestResult.published_at ||
              childLatestResult.created_at ||
              null,
          }
        : null,
    };
  });

  const attendanceRate = buildAttendanceRate(attendanceRows || []);

  const childMap = new Map(linkedChildren.map((child) => [child.id, child.name]));
  const latestResults = (resultsRows || []).slice(0, 8).map((row) => ({
    studentName: row.studentName || childMap.get(row.studentId || row.student_id) || 'Student',
    score: typeof row.score === 'number' ? row.score : Number(row.score || 0),
    createdAt: row.publishedAt || row.published_at || row.created_at || null,
  }));

  return { linkedChildren, attendanceRate, latestResults };
}

export function buildParentHomeSummary(input = {}) {
  const childrenCount = coerceCount(input.childrenCount);
  const unreadMessages = coerceCount(input.unreadMessages);
  const announcementsCount = coerceCount(input.announcementsCount);

  return {
    childrenCount,
    unreadMessages,
    announcementsCount,
    childrenNote: childrenCount > 0 ? 'Linked to your account' : 'No children linked yet',
    messagesNote: unreadMessages > 0 ? 'From school staff' : 'No unread messages',
    noticesNote: announcementsCount > 0 ? 'Latest updates' : 'No notices published',
  };
}

export async function getParentAttendance(options = {}, requestFn) {
  const query = buildAttendanceQuery(options);
  return readThroughReadMostlyCache(buildParentAttendanceCacheKey(options), async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn(`/api/parent/attendance?${query}`);
    return {
      range: payload?.data?.range || options.range || '1m',
      startDate: payload?.data?.startDate || null,
      endDate: payload?.data?.endDate || null,
      summary: payload?.data?.summary || {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      },
      children: payload?.data?.children || [],
      rows: payload?.data?.rows || [],
    };
  });
}

export function peekParentAttendance(options = {}) {
  return peekReadMostlyCacheValue(buildParentAttendanceCacheKey(options));
}

export async function getParentDashboardSummary() {
  const client = await requireSupabaseClient();

  const { data: parentId, error: parentErr } = await client.rpc('get_my_parent_id');
  if (parentErr) throw parentErr;
  if (!parentId) {
    return buildParentHomeSummary();
  }

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr) throw userErr;

  const userId = user?.id || null;
  let schoolId = null;
  if (userId) {
    const { data: profile } = await client
      .from('profiles')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle();
    schoolId = profile?.school_id || null;
  }

  const parentLinkIds = [parentId, userId].filter(Boolean);
  const [parentLinksRes, announcementsRes] = await Promise.all([
    client
      .from('parent_students')
      .select('parent_id, student_id')
      .in('parent_id', parentLinkIds),
    schoolId
      ? client.from('announcements').select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
      : Promise.resolve({ count: 0 }),
  ]);
  if (parentLinksRes.error) throw parentLinksRes.error;

  let unreadMessages = 0;
  if (userId) {
    const { count } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    unreadMessages = count || 0;
  }

  return buildParentHomeSummary({
    childrenCount: countLinkedParentStudents(parentLinksRes.data || [], parentLinkIds),
    announcementsCount: announcementsRes.count || 0,
    unreadMessages,
  });
}

export async function getParentProgressSummary(requestFn) {
  return readThroughReadMostlyCache('parent:progress', async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());

    const [childrenPayload, attendancePayload, resultsPayload] = await Promise.all([
      resolvedRequestFn('/api/parent/children'),
      resolvedRequestFn('/api/parent/attendance?range=1m'),
      resolvedRequestFn('/api/parent/results'),
    ]);

    return buildParentProgressFromApi({
      children: childrenPayload?.data || attendancePayload?.data?.children || [],
      attendanceRows: attendancePayload?.data?.rows || [],
      resultsRows: resultsPayload?.data || [],
    });
  });
}

export function peekParentProgressSummary() {
  return peekReadMostlyCacheValue('parent:progress');
}

export async function getParentFeesSummary() {
  const client = await requireSupabaseClient();
  const { data: parentId, error: parentErr } = await client.rpc('get_my_parent_id');
  if (parentErr) throw parentErr;
  if (!parentId) {
    return {
      balance: null,
      upcomingDue: null,
      recentPayments: [],
    };
  }

  const parentLinkIds = [parentId];
  const {
    data: {
      user,
    } = {},
    error: userErr,
  } = await client.auth.getUser();
  if (userErr) throw userErr;
  if (user?.id) {
    parentLinkIds.push(user.id);
  }

  const { data: links, error: linksErr } = await client
    .from('parent_students')
    .select('parent_id, student_id')
    .in('parent_id', parentLinkIds);
  if (linksErr) throw linksErr;

  const studentIds = collectLinkedStudentIds(links || [], parentLinkIds);
  if (studentIds.length === 0) {
    return {
      balance: null,
      upcomingDue: null,
      recentPayments: [],
    };
  }

  // Try common fee table names while staying backward-compatible with varying schemas.
  const tableCandidates = ['fee_records', 'fees', 'fee_payments', 'payments'];
  const feeResults = [];
  for (const table of tableCandidates) {
    const res = await client.from(table).select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(50);
    if (!res.error) {
      feeResults.push({ table, rows: res.data || [] });
    }
  }
  const feeRows = pickFirstPopulatedFeeRows(feeResults);

  if (feeRows.length === 0) {
    return {
      balance: null,
      upcomingDue: null,
      recentPayments: [],
    };
  }

  let balance = 0;
  const recentPayments = [];
  let upcomingDue = null;
  for (const row of feeRows) {
    const amount = Number(row.amount ?? row.balance ?? row.total ?? 0);
    const paid = Number(row.paid_amount ?? row.paid ?? 0);
    const dueDate = row.due_date || row.date_due || null;
    const status = String(row.status || '').toLowerCase();

    if (status.includes('paid') || paid >= amount) {
      recentPayments.push({
        amount: paid || amount,
        date: row.updated_at || row.created_at || null,
        reference: row.reference || row.receipt_no || row.id,
      });
    } else {
      balance += Math.max(0, amount - paid);
      if (!upcomingDue && dueDate) upcomingDue = dueDate;
    }
  }

  return {
    balance,
    upcomingDue,
    recentPayments: recentPayments.slice(0, 6),
  };
}
