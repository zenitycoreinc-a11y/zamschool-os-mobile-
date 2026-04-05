const APP_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'classroom_ops', label: 'Classroom Operations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'results', label: 'Results' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'messages', label: 'Messages' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'student_profiles', label: 'Student Profiles' },
  { key: 'finance_summary', label: 'Finance Summary' },
  { key: 'school_admin', label: 'School Administration' },
];

const ACCESS_LABELS = {
  none: 'No access',
  read: 'Read',
  manage: 'Manage',
  publish: 'Publish',
  view_summary: 'Summary only',
};

const ROLE_POLICIES = {
  admin: {
    role: 'admin',
    label: 'Administrator',
    previewState: 'ready',
    mobilePreview: {
      management: 'hidden',
      managementLabel: 'Web-only',
    },
    mission:
      'Runs the school platform, handles governance, and keeps core records, users, and school settings accurate.',
    modules: {
      dashboard: 'manage',
      classroom_ops: 'manage',
      attendance: 'manage',
      results: 'manage',
      assignments: 'manage',
      timetable: 'manage',
      messages: 'manage',
      announcements: 'publish',
      student_profiles: 'manage',
      finance_summary: 'manage',
      school_admin: 'manage',
    },
  },
  teacher: {
    role: 'teacher',
    label: 'Teacher',
    mission:
      'Teachers are the daily operators of school life. In a Zambian school context, they need one place to manage attendance, marks, assignments, notices, and parent communication without extra paper work.',
    modules: {
      dashboard: 'manage',
      classroom_ops: 'manage',
      attendance: 'manage',
      results: 'manage',
      assignments: 'manage',
      timetable: 'read',
      messages: 'manage',
      announcements: 'publish',
      student_profiles: 'read',
      finance_summary: 'view_summary',
      school_admin: 'none',
    },
  },
  student: {
    role: 'student',
    label: 'Student',
    mission:
      'Tracks personal learning, attendance, notices, and school communication from a single mobile space.',
    modules: {
      dashboard: 'read',
      classroom_ops: 'none',
      attendance: 'read',
      results: 'read',
      assignments: 'read',
      timetable: 'read',
      messages: 'read',
      announcements: 'read',
      student_profiles: 'read',
      finance_summary: 'none',
      school_admin: 'none',
    },
  },
  parent: {
    role: 'parent',
    label: 'Parent',
    mission:
      'Follows child attendance, messages, notices, and fees so families stay close to school life.',
    modules: {
      dashboard: 'read',
      classroom_ops: 'none',
      attendance: 'read',
      results: 'read',
      assignments: 'read',
      timetable: 'read',
      messages: 'read',
      announcements: 'read',
      student_profiles: 'read',
      finance_summary: 'read',
      school_admin: 'none',
    },
  },
  payments: {
    role: 'payments',
    label: 'Payments',
    previewState: 'preview-incomplete',
    mission:
      'Owns fee collection, payment reconciliation, and finance visibility for the school while staying out of wider academic administration.',
    modules: {
      dashboard: 'manage',
      classroom_ops: 'none',
      attendance: 'none',
      results: 'none',
      assignments: 'none',
      timetable: 'read',
      messages: 'manage',
      announcements: 'read',
      student_profiles: 'read',
      finance_summary: 'manage',
      school_admin: 'none',
    },
  },
};

export function getRolePolicy(role) {
  return ROLE_POLICIES[role] || ROLE_POLICIES.student;
}

export function getRoleModuleEntries(role) {
  const policy = getRolePolicy(role);
  return APP_MODULES.map((module) => ({
    ...module,
    access: policy.modules[module.key] || 'none',
    accessLabel: ACCESS_LABELS[policy.modules[module.key] || 'none'],
  }));
}

export function getRoleAccessSummary(role) {
  const entries = getRoleModuleEntries(role);
  const accessible = entries.filter((entry) => entry.access !== 'none');
  const percent = Math.round((accessible.length / entries.length) * 100);

  return {
    totalModules: entries.length,
    accessibleModules: accessible.length,
    percent,
    entries,
  };
}
