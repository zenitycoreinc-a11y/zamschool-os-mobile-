const SAFE_MONITOR_NOTICE = 'Roll-call monitoring is temporarily unavailable on mobile.';
const DEFAULT_RANGE = '1w';
const ALLOWED_MONITOR_RANGES = new Set(['1d', '1w', '1m', '3m', '1y']);

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function toCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function toLowerText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildClassIdentity(source = {}) {
  const classId =
    source.classId ||
    source.class_id ||
    ((source.summary || source.attendanceCount != null || source.lessonCount != null) && source.id) ||
    '';
  const className = source.className || source.class_name || source.name || '';

  if (classId) {
    return {
      id: classId,
      name: className || 'Unnamed class',
    };
  }

  if (className) {
    return {
      id: `class-name:${toLowerText(className)}`,
      name: className,
    };
  }

  const lessonId = source.lessonId || source.lesson_id || '';
  if (lessonId) {
    return {
      id: `lesson:${lessonId}`,
      name: className || 'Unassigned class',
    };
  }

  return {
    id: `row:${source.id || 'unassigned'}`,
    name: className || 'Unassigned class',
  };
}

function isSickRow(row = {}) {
  if (String(row.status || '').toUpperCase() === 'EXCUSED') {
    return true;
  }

  const remarks = [row.remarks, row.notes].map(toLowerText).filter(Boolean).join(' ');
  return remarks.includes('sick') || remarks.includes('clinic') || remarks.includes('medical');
}

function mapLearnerRow(row = {}) {
  return {
    id: row.studentId || row.student_id || row.id || '',
    name: row.studentName || row.student_name || 'Unknown learner',
    status: String(row.status || '').toUpperCase(),
    remarks: row.remarks || row.notes || '',
  };
}

function normalizeSummary(summary = {}) {
  return {
    missingMorningRollCalls: toCount(summary.ABSENT),
    unresolvedMorningRollCalls: toCount(summary.ABSENT),
    sickLearners: toCount(summary.EXCUSED),
    lateLearners: toCount(summary.LATE),
    presentLearners: toCount(summary.PRESENT),
  };
}

function createClassCard(source = {}) {
  const summary = source.summary || {};
  const identity = buildClassIdentity(source);

  return {
    id: identity.id,
    name: identity.name,
    attendanceCount: toCount(source.attendanceCount),
    lessonCount: toCount(source.lessonCount),
    missingCount: toCount(summary.ABSENT),
    unresolvedCount: toCount(summary.ABSENT),
    sickCount: toCount(summary.EXCUSED),
    lateCount: toCount(summary.LATE),
    seenStatusLearners: {
      ABSENT: new Set(),
      LATE: new Set(),
      SICK: new Set(),
    },
    absentStudents: [],
    sickStudents: [],
    lateStudents: [],
  };
}

function getOrCreateClassCard(classMap, row) {
  const identity = buildClassIdentity(row);
  const classId = identity.id;
  if (!classMap.has(classId)) {
    classMap.set(
      classId,
      createClassCard({
        id: classId,
        name: identity.name,
      })
    );
  }

  return classMap.get(classId);
}

export function buildAdminRollCallMonitorFallback(
  notice = SAFE_MONITOR_NOTICE,
  errorMessage = ''
) {
  return {
    summary: {
      missingMorningRollCalls: 0,
      unresolvedMorningRollCalls: 0,
      sickLearners: 0,
      lateLearners: 0,
      presentLearners: 0,
    },
    classes: [],
    notice,
    errorMessage,
  };
}

export function normalizeAdminRollCallMonitor(payload = {}) {
  const data = payload?.data || payload || {};
  const classMap = new Map(
    (Array.isArray(data.classBreakdown) ? data.classBreakdown : []).map((row) => [
      row.id || row.classId || '',
      createClassCard(row),
    ])
  );

  for (const row of Array.isArray(data.rows) ? data.rows : []) {
    const classCard = getOrCreateClassCard(classMap, row);
    const learner = mapLearnerRow(row);
    const learnerId = learner.id || row.id || `${learner.name}-${learner.status}`;

    if (learner.status === 'ABSENT' && !classCard.seenStatusLearners.ABSENT.has(learnerId)) {
      classCard.seenStatusLearners.ABSENT.add(learnerId);
      classCard.absentStudents.push(learner);
    }

    if (learner.status === 'LATE' && !classCard.seenStatusLearners.LATE.has(learnerId)) {
      classCard.seenStatusLearners.LATE.add(learnerId);
      classCard.lateStudents.push(learner);
    }

    if (isSickRow(row) && !classCard.seenStatusLearners.SICK.has(learnerId)) {
      classCard.seenStatusLearners.SICK.add(learnerId);
      classCard.sickStudents.push(learner);
    }
  }

  const classes = [...classMap.values()].map((item) => {
    const { seenStatusLearners, ...classCard } = item;
    return {
      ...classCard,
      missingCount: item.missingCount || item.absentStudents.length,
      unresolvedCount: item.unresolvedCount || item.absentStudents.length,
      sickCount: item.sickCount || item.sickStudents.length,
      lateCount: item.lateCount || item.lateStudents.length,
    };
  });

  return {
    summary: normalizeSummary(data.summary),
    classes,
    notice: '',
    errorMessage: '',
  };
}

export async function getAdminRollCallMonitor({ range = DEFAULT_RANGE, requestFn } = {}) {
  const safeRange = String(range || DEFAULT_RANGE).trim();
  if (!ALLOWED_MONITOR_RANGES.has(safeRange)) {
    throw new Error(`Invalid range: ${safeRange}. Must be one of 1d, 1w, 1m, 3m, 1y.`);
  }

  const resolvedRequestFn = requestFn || (await getApiRequest());

  try {
    const payload = await resolvedRequestFn(`/api/admin/attendance/summary?range=${safeRange}`);
    return normalizeAdminRollCallMonitor(payload);
  } catch (error) {
    return buildAdminRollCallMonitorFallback(
      SAFE_MONITOR_NOTICE,
      error?.message || 'Failed to load roll-call monitoring.'
    );
  }
}
