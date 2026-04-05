import {
  peekReadMostlyCacheValue,
  readThroughReadMostlyCache,
} from './readMostlyCache.js';

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

const EMPTY_ATTENDANCE_SUMMARY = Object.freeze({
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  EXCUSED: 0,
  total: 0,
  rate: 0,
});

function coerceNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatTime(value) {
  const safe = String(value || '').trim();
  if (!safe) return '--:--';
  return safe.slice(0, 5);
}

function formatTimeRange(startTime, endTime) {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function buildClassLabel(gradeLabel, className) {
  const safeGrade = String(gradeLabel || '').trim();
  const safeClass = String(className || '').trim();
  if (safeGrade && safeClass) return `${safeGrade} - ${safeClass}`;
  return safeGrade || safeClass || 'No class assigned';
}

function normalizeAttendanceStatus(status) {
  return String(status || '').trim().toLowerCase() || 'unknown';
}

function buildAttendanceSummary(summary) {
  const mapped = {
    PRESENT: coerceNumber(summary?.PRESENT),
    ABSENT: coerceNumber(summary?.ABSENT),
    LATE: coerceNumber(summary?.LATE),
    EXCUSED: coerceNumber(summary?.EXCUSED),
  };
  const total = summary?.total == null
    ? mapped.PRESENT + mapped.ABSENT + mapped.LATE + mapped.EXCUSED
    : coerceNumber(summary?.total);
  const rate = summary?.rate == null ? 0 : coerceNumber(summary?.rate);

  return {
    ...mapped,
    total,
    rate,
  };
}

export function buildStudentDashboardViewModel(payload = {}) {
  const attendanceSummary = buildAttendanceSummary(payload?.attendance?.summary || EMPTY_ATTENDANCE_SUMMARY);
  const todayLessons = (payload?.todayLessons || []).map((lesson) => ({
    id: lesson.id,
    subjectName: lesson.subjectName || 'Subject',
    teacherName: lesson.teacherName || 'Teacher pending',
    className: lesson.className || 'Class pending',
    room: lesson.room || 'Room pending',
    startTime: lesson.startTime || null,
    endTime: lesson.endTime || null,
    timeLabel: formatTimeRange(lesson.startTime, lesson.endTime),
    statusLabel: lesson.isCurrent ? 'Now' : 'Scheduled',
    isCurrent: lesson.isCurrent === true,
  }));

  const upcomingAssignments = (payload?.assignments?.rows || []).map((assignment) => ({
    id: assignment.id,
    title: assignment.title || 'Assignment',
    subjectName: assignment.subjectName || 'General',
    teacherName: assignment.teacherName || 'Teacher pending',
    dueDate: assignment.dueDate || null,
    totalMarks: assignment.totalMarks == null ? null : coerceNumber(assignment.totalMarks),
    urgent: assignment.urgent === true,
  }));

  const attendanceRows = (payload?.attendance?.rows || []).map((row) => ({
    id: row.id,
    date: row.date || null,
    status: normalizeAttendanceStatus(row.status),
    subjectName: row.subjectName || 'Subject',
    className: row.className || 'Class',
    teacherName: row.teacherName || 'Teacher pending',
    startTime: row.startTime || null,
    endTime: row.endTime || null,
    timeLabel: formatTimeRange(row.startTime, row.endTime),
    remarks: row.remarks || '',
  }));

  const gradeLabel = payload?.profile?.gradeLabel || null;
  const className = payload?.profile?.className || null;
  const classLabel = buildClassLabel(gradeLabel, className);
  const assignmentTotal = payload?.assignments?.total == null
    ? upcomingAssignments.length
    : coerceNumber(payload?.assignments?.total);
  const urgentAssignments = payload?.assignments?.urgent == null
    ? upcomingAssignments.filter((item) => item.urgent).length
    : coerceNumber(payload?.assignments?.urgent);

  return {
    profile: {
      id: payload?.profile?.id || null,
      displayName: payload?.profile?.fullName || payload?.profile?.email || 'Student',
      email: payload?.profile?.email || null,
      admissionLabel: payload?.profile?.admissionNumber || 'No admission number',
      classId: payload?.profile?.classId || null,
      classLabel,
      gradeLabel: gradeLabel || 'No grade assigned',
    },
    metrics: {
      attendance: {
        value: `${attendanceSummary.rate}%`,
        note: attendanceSummary.total > 0 ? `${attendanceSummary.PRESENT} present records logged` : 'No attendance yet',
      },
      assignments: {
        value: `${assignmentTotal}`,
        note: assignmentTotal > 0 ? `${urgentAssignments} due soon` : 'No assignments yet',
      },
      lessons: {
        value: `${todayLessons.length}`,
        note: todayLessons.length > 0 ? `${todayLessons[0].subjectName} starts at ${formatTime(todayLessons[0].startTime)}` : 'No timetable assigned',
      },
    },
    todayLessons,
    upcomingAssignments,
    attendance: {
      summary: attendanceSummary,
      rows: attendanceRows,
    },
  };
}

export async function getStudentDashboard(requestFn) {
  return readThroughReadMostlyCache('student:dashboard', async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn('/api/student/dashboard');
    return buildStudentDashboardViewModel(payload?.data || {});
  });
}

export function peekStudentDashboard() {
  return peekReadMostlyCacheValue('student:dashboard');
}
