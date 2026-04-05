const SAFE_OVERVIEW_NOTICE = 'Admin overview is temporarily unavailable on mobile.';
const SAFE_DIRECTORY_NOTICE = 'Admin user data is temporarily unavailable on mobile.';
const SAFE_FALLBACK_NOTICE = 'Direct admin counts unavailable. Showing a safe mobile fallback.';
const ROLE_SORT_ORDER = ['parent', 'student', 'teacher', 'admin'];

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function sortDirectoryRows(rows = []) {
  return [...rows].sort((left, right) => {
    const roleOrder =
      ROLE_SORT_ORDER.indexOf(left.role || 'admin') - ROLE_SORT_ORDER.indexOf(right.role || 'admin');
    if (roleOrder !== 0) {
      return roleOrder;
    }

    return String(left.fullName || left.email || '').localeCompare(
      String(right.fullName || right.email || '')
    );
  });
}

async function safeCount(client, table) {
  try {
    const result = await client.from(table).select('id', { count: 'exact', head: true });
    if (result?.error || typeof result?.count !== 'number') {
      return null;
    }
    return result.count;
  } catch {
    return null;
  }
}

function buildProfileName(row) {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim();
  return name || row?.displayName || row?.email || 'Unnamed User';
}

export function buildAdminOverviewFallback(notice = SAFE_OVERVIEW_NOTICE) {
  return {
    profiles: 0,
    students: 0,
    teachers: 0,
    announcements: 0,
    classes: 0,
    notice: notice || SAFE_OVERVIEW_NOTICE,
  };
}

export function normalizeAdminProfilesFromDirectory(directory = {}) {
  const rows = [
    ...(directory.parents || []).map((row) => ({
      id: row.profileId || row.id,
      fullName: row.displayName || row.email || 'Parent',
      email: row.email || null,
      role: 'parent',
    })),
    ...(directory.students || []).map((row) => ({
      id: row.profileId || row.id,
      fullName: row.displayName || row.email || 'Student',
      email: row.email || null,
      role: 'student',
    })),
    ...(directory.teachers || []).map((row) => ({
      id: row.profileId || row.id,
      fullName: row.displayName || row.email || 'Teacher',
      email: row.email || null,
      role: 'teacher',
    })),
  ]
    .filter((row) => row.id)
    .map((row) => ({
      id: row.id,
      first_name: null,
      last_name: null,
      fullName: row.fullName,
      email: row.email,
      role: row.role,
      school_id: null,
    }));

  return sortDirectoryRows(rows);
}

export async function getAdminOverviewCounts({ clientOverride, requestFn } = {}) {
  const client = clientOverride || (await requireSupabaseClient());
  const [profiles, students, teachers, announcements] = await Promise.all([
    safeCount(client, 'profiles'),
    safeCount(client, 'students'),
    safeCount(client, 'teachers'),
    safeCount(client, 'announcements'),
  ]);

  if ([profiles, students, teachers, announcements].every((count) => count != null)) {
    return {
      profiles,
      students,
      teachers,
      announcements,
      classes: 0,
      notice: '',
    };
  }

  const resolvedRequestFn = requestFn || (await getApiRequest());

  try {
    const payload = await resolvedRequestFn('/api/admin/relationships');
    const directory = payload?.data || {};
    const parentCount = Array.isArray(directory.parents) ? directory.parents.length : 0;
    const studentCount = Array.isArray(directory.students) ? directory.students.length : 0;
    const teacherCount = Array.isArray(directory.teachers) ? directory.teachers.length : 0;
    const classCount = Array.isArray(directory.classes) ? directory.classes.length : 0;

    return {
      profiles: parentCount + studentCount + teacherCount,
      students: studentCount,
      teachers: teacherCount,
      announcements: 0,
      classes: classCount,
      notice: SAFE_FALLBACK_NOTICE,
    };
  } catch {
    return buildAdminOverviewFallback();
  }
}

export async function getAdminUsersDirectory(limit = 100, { clientOverride, requestFn } = {}) {
  const client = clientOverride || (await requireSupabaseClient());

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, role, school_id, email')
      .order('first_name', { ascending: true })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      return {
        rows: sortDirectoryRows(
          data.map((row) => ({
            ...row,
            fullName: buildProfileName(row),
          }))
        ),
        notice: '',
      };
    }
  } catch {
    // Fall through to the safe relationship directory fallback.
  }

  const resolvedRequestFn = requestFn || (await getApiRequest());

  try {
    const payload = await resolvedRequestFn('/api/admin/relationships');
    return {
      rows: normalizeAdminProfilesFromDirectory(payload?.data || {}).slice(0, limit),
      notice: SAFE_FALLBACK_NOTICE,
    };
  } catch {
    return {
      rows: [],
      notice: SAFE_DIRECTORY_NOTICE,
    };
  }
}

export async function listProfiles(limit = 100, options = {}) {
  const directory = await getAdminUsersDirectory(limit, options);
  return directory.rows;
}
