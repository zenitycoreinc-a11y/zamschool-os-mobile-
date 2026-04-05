import { normalizeKnownRole } from './roleNormalization.js';

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function resolveRole(user, roleOverride) {
  const candidate =
    roleOverride ||
    user?.user_metadata?.role ||
    user?.app_metadata?.role ||
    user?.app_metadata?.user_role ||
    null;
  return normalizeKnownRole(candidate);
}

function resolveMustChangePassword(user) {
  return (
    user?.user_metadata?.must_change_password === true ||
    user?.app_metadata?.must_change_password === true
  );
}

function formatRoleLabel(role) {
  const normalized = normalizeKnownRole(role);
  if (normalized === 'unknown') {
    return 'Unknown';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatStatusLabel(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) {
    return 'Status pending';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function buildFallbackProfile(user, roleOverride) {
  const safeRole = resolveRole(user, roleOverride);
  const first = user?.user_metadata?.first_name;
  const last = user?.user_metadata?.last_name;
  const fullNameFromMeta = [first, last].filter(Boolean).join(' ').trim();
  return {
    id: user?.id || null,
    fullName: fullNameFromMeta || user?.user_metadata?.full_name || user?.email || 'User',
    role: safeRole,
    roleLabel: formatRoleLabel(safeRole),
    schoolId: null,
    email: user?.email || null,
    phone: null,
    avatarUrl: null,
    status: null,
    statusLabel: formatStatusLabel(null),
    mustChangePassword: resolveMustChangePassword(user),
    profileMissing: true,
  };
}

export function buildProfileFromRow(row, fallbackEmail) {
  const firstName = row?.first_name || '';
  const lastName = row?.last_name || '';
  return {
    id: row?.id || null,
    fullName: [firstName, lastName].filter(Boolean).join(' ').trim() || fallbackEmail || 'User',
    role: normalizeKnownRole(row?.role),
    roleLabel: formatRoleLabel(row?.role),
    schoolId: row?.school_id || null,
    email: row?.email || fallbackEmail || null,
    phone: row?.phone || null,
    avatarUrl: row?.avatar_url || row?.photo_url || null,
    status: row?.status || null,
    statusLabel: formatStatusLabel(row?.status),
    mustChangePassword: row?.must_change_password === true,
    profileMissing: false,
  };
}

function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return error?.code === '42703' || message.includes('does not exist');
}

async function maybeSingleProfileWithFallback(client, userId, selectCandidates) {
  let lastError = null;

  for (const selectClause of selectCandidates) {
    const result = await client
      .from('profiles')
      .select(selectClause)
      .eq('id', userId)
      .maybeSingle();

    if (!result.error) {
      return result;
    }

    lastError = result.error;
    if (!isMissingColumnError(result.error)) {
      return result;
    }
  }

  return { data: null, error: lastError };
}

const PROFILE_SELECT_CANDIDATES = [
  'id, first_name, last_name, role, school_id, email, phone, status, must_change_password',
  'id, first_name, last_name, role, school_id, email, phone, must_change_password',
  'id, first_name, last_name, role, school_id, email, phone',
  'id, first_name, last_name, role, school_id, email',
];

const DETAILED_PROFILE_SELECT_CANDIDATES = [
  `
      id, first_name, last_name, role, school_id, email, phone, status, must_change_password,
      admission_number, class_id, grade_id,
      classes:classes(id, name, grade_id, grades:grades(id, level, name))
    `,
  `
      id, first_name, last_name, role, school_id, email, phone, must_change_password,
      admission_number, class_id, grade_id,
      classes:classes(id, name, grade_id, grades:grades(id, level, name))
    `,
  `
      id, first_name, last_name, role, school_id, email, phone,
      admission_number, class_id, grade_id,
      classes:classes(id, name, grade_id, grades:grades(id, level, name))
    `,
];

const BASIC_DETAILED_PROFILE_SELECT_CANDIDATES = [
  'id, first_name, last_name, role, school_id, email, phone, status, admission_number, class_id',
  'id, first_name, last_name, role, school_id, email, phone, admission_number, class_id',
  'id, first_name, last_name, role, school_id, email, admission_number, class_id',
  'id, first_name, last_name, role, school_id, email',
];

export function buildDetailedFallbackProfile(user, roleOverride) {
  return {
    ...buildFallbackProfile(user, roleOverride),
    admissionNumber: null,
    classId: null,
    gradeId: null,
    className: null,
    gradeLevel: null,
    gradeLabel: null,
  };
}

async function loadAvatarUrl(client, userId) {
  // Optimized: Parallel check for avatar_url and photo_url
  const [avatarQuery, photoQuery] = await Promise.all([
    client.from('profiles').select('avatar_url').eq('id', userId).maybeSingle(),
    client.from('profiles').select('photo_url').eq('id', userId).maybeSingle(),
  ]);

  if (!avatarQuery.error && avatarQuery.data?.avatar_url) {
    return avatarQuery.data.avatar_url;
  }
  if (!photoQuery.error && photoQuery.data?.photo_url) {
    return photoQuery.data.photo_url;
  }
  return null;
}

const MISSING_SHARED_PROFILE_MESSAGE =
  'Your account is missing a shared profile. Contact your school administrator.';

export async function getMyProfile(clientOverride) {
  const client = clientOverride || (await requireSupabaseClient());
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  // Optimized: Fetch profile and avatar in parallel
  const [profileResult, avatarUrl] = await Promise.all([
    maybeSingleProfileWithFallback(client, user.id, PROFILE_SELECT_CANDIDATES),
    loadAvatarUrl(client, user.id),
  ]);

  const { data, error } = profileResult;

  if (error || !data) {
    throw new Error(MISSING_SHARED_PROFILE_MESSAGE);
  }

  return {
    ...buildProfileFromRow(data, user.email),
    avatarUrl,
    mustChangePassword: data?.must_change_password === true || resolveMustChangePassword(user),
  };
}

export async function getMyProfileWithDetails(clientOverride) {
  const client = clientOverride || (await requireSupabaseClient());
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  // Optimized: Parallel fetch of detailed profile and avatar
  const [detailedResult, avatarUrl] = await Promise.all([
    maybeSingleProfileWithFallback(client, user.id, DETAILED_PROFILE_SELECT_CANDIDATES),
    loadAvatarUrl(client, user.id),
  ]);

  const { data, error } = detailedResult;

  if (error || !data) {
    if (!error || !isMissingColumnError(error)) {
      return buildDetailedFallbackProfile(user);
    }

    const { data: basicProfile, error: basicError } = await maybeSingleProfileWithFallback(
      client,
      user.id,
      BASIC_DETAILED_PROFILE_SELECT_CANDIDATES
    );

    if (basicError || !basicProfile) {
      return buildDetailedFallbackProfile(user);
    }

    let className = null;
    let gradeLevel = null;
    if (basicProfile.class_id) {
      const { data: classRow } = await client
        .from('classes')
        .select('id, name, grade_level')
        .eq('id', basicProfile.class_id)
        .maybeSingle();

      className = classRow?.name || null;
      gradeLevel = classRow?.grade_level ?? null;
    }

    return {
      id: basicProfile.id,
      fullName: [basicProfile.first_name, basicProfile.last_name].filter(Boolean).join(' ').trim() || user.email || 'User',
      role: basicProfile.role,
      schoolId: basicProfile.school_id,
      email: basicProfile.email,
      phone: basicProfile.phone || null,
      avatarUrl,
      status: basicProfile.status || null,
      mustChangePassword: resolveMustChangePassword(user),
      admissionNumber: basicProfile.admission_number || null,
      classId: basicProfile.class_id || null,
      gradeId: null,
      className,
      gradeLevel,
      gradeLabel: gradeLevel ? `Grade ${gradeLevel}` : null,
    };
  }

  return {
    id: data.id,
    fullName: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || user.email || 'User',
    role: data.role,
    schoolId: data.school_id,
    email: data.email,
    phone: data.phone || null,
    avatarUrl,
    status: data.status || null,
    mustChangePassword: data.must_change_password === true,
    admissionNumber: data.admission_number,
    classId: data.class_id,
    gradeId: data.grade_id,
    className: data.classes?.name || null,
    gradeLevel: data.classes?.grades?.level || null,
    gradeLabel: data.classes?.grades?.level ? `Grade ${data.classes.grades.level}` : null,
  };
}

export async function uploadMyProfileAvatar({ base64, mimeType }, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn('/api/account/avatar', {
    method: 'POST',
    body: JSON.stringify({
      base64,
      mimeType,
    }),
  });

  return payload?.data?.avatarUrl || null;
}
