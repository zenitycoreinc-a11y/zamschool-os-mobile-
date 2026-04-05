const SAFE_DIRECTORY_NOTICE = 'People directory is temporarily unavailable on mobile.';
const SAFE_DETAIL_MESSAGE = 'User details are temporarily unavailable on mobile.';
const ROLE_ORDER = ['student', 'teacher', 'parent'];

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function resolveDirectoryArgs(limitOrOptions, requestOverride) {
  if (typeof limitOrOptions === 'number') {
    return {
      limit: limitOrOptions,
      requestFn: requestOverride || null,
    };
  }

  return {
    limit: Number(limitOrOptions?.limit || 160),
    requestFn: limitOrOptions?.requestFn || requestOverride || null,
  };
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function compactItems(items = []) {
  return items.filter((item) => item?.value != null && item?.value !== '');
}

function formatCurrency(amount, currency = 'ZMW') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return 'Not available';
  }

  return `${currency} ${numeric.toFixed(0)}`;
}

function sortRows(rows = []) {
  return [...rows].sort((left, right) => {
    const roleDelta =
      ROLE_ORDER.indexOf(left.role || 'student') - ROLE_ORDER.indexOf(right.role || 'student');
    if (roleDelta !== 0) {
      return roleDelta;
    }

    return String(left.fullName || '').localeCompare(String(right.fullName || ''));
  });
}

export function buildAdminPeopleDirectory(directory = {}) {
  const rows = sortRows([
    ...(directory.students || []).map((row) => ({
      id: row.profileId || row.id,
      role: 'student',
      fullName: row.displayName || row.fullName || row.email || 'Student',
      email: row.email || null,
      summary: row.className || 'Unassigned class',
      secondary: row.admissionNumber || 'Student account',
    })),
    ...(directory.teachers || []).map((row) => ({
      id: row.profileId || row.id,
      role: 'teacher',
      fullName: row.displayName || row.fullName || row.email || 'Teacher',
      email: row.email || null,
      summary: 'Teacher account',
      secondary: row.employeeId || 'Teacher account',
    })),
    ...(directory.parents || []).map((row) => {
      const linkedChildren = (row.linkedStudentProfileIds || []).length;

      return {
        id: row.profileId || row.id,
        role: 'parent',
        fullName: row.displayName || row.fullName || row.email || 'Parent',
        email: row.email || null,
        summary: pluralize(linkedChildren, 'linked child', 'linked children'),
        secondary: 'Parent account',
      };
    }),
  ].filter((row) => row.id));

  return {
    rows,
    groups: [
      { key: 'student', label: 'Students', items: rows.filter((row) => row.role === 'student') },
      { key: 'teacher', label: 'Teachers', items: rows.filter((row) => row.role === 'teacher') },
      { key: 'parent', label: 'Parents', items: rows.filter((row) => row.role === 'parent') },
    ],
    notice: directory.notice || '',
    errorMessage: directory.errorMessage || '',
  };
}

function buildSections(sections = []) {
  return sections.filter((section) => Array.isArray(section?.items) && section.items.length > 0);
}

function buildStudentDetail(detail = {}) {
  const student = detail.student || detail;
  const attendance = student.attendance || student.attendanceSummary || {};
  const finance = student.finance || student.feeSummary || {};
  const guardians = student.guardians || student.linkedParents || [];
  const results = student.results || { rows: student.latestResults || [], average: null };

  return {
    eyebrow: 'Student',
    title: detail.displayName || detail.fullName || detail.email || 'Student',
    subtitle: student.className || detail.className || '',
    metadataItems: compactItems([
      { label: 'Class', value: student.className || detail.className || 'Unassigned class' },
      { label: 'Admission', value: student.admissionNumber || detail.admissionNumber || 'Not assigned' },
      { label: 'Fee balance', value: formatCurrency(finance.balance, finance.currency || 'ZMW') },
    ]),
    sections: buildSections([
      {
        title: 'Attendance',
        items: compactItems([
          { label: 'Present', value: String(attendance.present || 0) },
          { label: 'Absent', value: String(attendance.absent || 0) },
          { label: 'Sick', value: String(attendance.sick || 0) },
          { label: 'Late', value: String(attendance.late || 0) },
        ]),
      },
      {
        title: 'Family',
        items: (guardians || []).map((row) => ({
          label: 'Linked parent',
          value: row.fullName || row.name || row.email || 'Parent',
        })),
      },
      {
        title: 'Latest result',
        items:
          Array.isArray(results.rows) && results.rows.length > 0
            ? [
                {
                  label: results.rows[0].subjectName || 'Subject',
                  value: `${results.rows[0].score ?? 'N/A'}${results.rows[0].grade ? ` (${results.rows[0].grade})` : ''}`,
                },
              ]
            : [],
      },
    ]),
    body: student.note || detail.note || '',
  };
}

function buildTeacherDetail(detail = {}) {
  const teacher = detail.teacher || detail;
  const subjects = teacher.subjects || teacher.assignedSubjects || [];
  const assignedClasses = teacher.assignedClasses || [];

  return {
    eyebrow: 'Teacher',
    title: detail.displayName || detail.fullName || detail.email || 'Teacher',
    subtitle: detail.email || '',
    metadataItems: compactItems([
      { label: 'Employee', value: teacher.employeeId || detail.employeeId || 'Not assigned' },
      { label: 'Time at school', value: teacher.hireDateLabel || detail.hireDateLabel || teacher.hireDate || detail.hireDate || 'Not available' },
      { label: 'Assigned classes', value: String(teacher.assignedClassesCount || assignedClasses.length || 0) },
    ]),
    sections: buildSections([
      {
        title: 'Teaching',
        items: (subjects || []).map((subject) => ({
          label: 'Subject',
          value: typeof subject === 'string' ? subject : subject.name || 'Subject',
        })),
      },
      {
        title: 'Classes',
        items: (assignedClasses || []).map((row) => ({
          label: 'Class',
          value: typeof row === 'string' ? row : row.name || 'Class',
        })),
      },
    ]),
    body: teacher.note || detail.note || '',
  };
}

function buildParentDetail(detail = {}) {
  const parent = detail.parent || detail;
  const linkedChildren = parent.linkedChildren || [];

  return {
    eyebrow: 'Parent',
    title: detail.displayName || detail.fullName || detail.email || 'Parent',
    subtitle: detail.email || '',
    metadataItems: compactItems([
      { label: 'Relation', value: parent.relationType || 'Parent' },
      { label: 'Linked children', value: String(linkedChildren.length) },
    ]),
    sections: buildSections([
      {
        title: 'Children',
        items: linkedChildren.map((row) => ({
          label: 'Child',
          value: [row.fullName || row.displayName || row.name || 'Student', row.className]
            .filter(Boolean)
            .join(' - '),
        })),
      },
    ]),
    body: parent.note || '',
  };
}

export function buildAdminPersonDetail(detail = {}) {
  const role = String(detail.role || '').trim().toLowerCase();

  if (role === 'teacher') {
    return buildTeacherDetail(detail);
  }

  if (role === 'parent') {
    return buildParentDetail(detail);
  }

  return buildStudentDetail(detail);
}

export async function getAdminPeopleDirectory(limitOrOptions = {}, requestOverride) {
  const { limit, requestFn: requestFnOverride } = resolveDirectoryArgs(limitOrOptions, requestOverride);
  const requestFn = requestFnOverride || (await getApiRequest());

  try {
    const payload = await requestFn('/api/admin/relationships');
    const directory = buildAdminPeopleDirectory(payload?.data || {});

    return {
      ...directory,
      rows: directory.rows.slice(0, limit),
      groups: directory.groups.map((group) => ({
        ...group,
        items: group.items.slice(0, limit),
      })),
    };
  } catch (error) {
    return {
      rows: [],
      groups: buildAdminPeopleDirectory({}).groups,
      notice: SAFE_DIRECTORY_NOTICE,
      errorMessage: error?.message || 'Failed to load the people directory.',
    };
  }
}

export async function getAdminPersonDetail(profileIdOrOptions, maybeOptions = {}) {
  const options =
    typeof profileIdOrOptions === 'object' && profileIdOrOptions
      ? profileIdOrOptions
      : { profileId: profileIdOrOptions, ...maybeOptions };
  const requestFn = options?.requestFn || maybeOptions?.requestFn || (await getApiRequest());

  try {
    const payload = await requestFn(
      `/api/admin/users?profileId=${encodeURIComponent(options.profileId)}`
    );
    return buildAdminPersonDetail(payload?.data || {});
  } catch (error) {
    return {
      eyebrow: 'Details',
      title: 'User details unavailable',
      subtitle: '',
      metadataItems: [],
      sections: [],
      body: error?.message || SAFE_DETAIL_MESSAGE,
    };
  }
}
