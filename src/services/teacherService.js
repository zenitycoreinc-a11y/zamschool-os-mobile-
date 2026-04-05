import {
  invalidateReadMostlyCache,
  peekReadMostlyCacheValue,
  readThroughReadMostlyCache,
} from './readMostlyCache.js';

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

function normalizeLessonDate(onDate) {
  return onDate || new Date().toISOString().slice(0, 10);
}

function buildTeacherLessonsCacheKey(onDate) {
  return `teacher:lessons:${normalizeLessonDate(onDate)}`;
}

export async function listTeacherLessons(onDate, requestFn) {
  const date = normalizeLessonDate(onDate);
  return readThroughReadMostlyCache(buildTeacherLessonsCacheKey(date), async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn(`/api/teacher/classes?date=${encodeURIComponent(date)}`);
    return (payload.data || []).map((lesson) => ({
      id: lesson.id,
      date: lesson.date,
      classId: lesson.classId,
      className: lesson.className,
      subjectId: lesson.subjectId,
      subjectName: lesson.subjectName,
      subjectCode: lesson.subjectCode,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      room: lesson.room,
      rosterCount: lesson.rosterCount || 0,
      roster: (lesson.roster || []).map((student) => ({
        id: student.id,
        admissionNumber: student.admissionNumber || null,
        displayName: student.displayName || 'Student',
        email: student.email || null,
        status: student.status || null,
        remarks: student.remarks || '',
      })),
    }));
  });
}

export function peekTeacherLessons(onDate) {
  return peekReadMostlyCacheValue(buildTeacherLessonsCacheKey(onDate));
}

export function buildTeacherDashboardSummary(lessons = []) {
  const classIds = new Set();
  const studentIds = new Set();
  let fallbackRosterCount = 0;

  for (const lesson of lessons) {
    if (lesson.classId) classIds.add(lesson.classId);

    if (Array.isArray(lesson.roster) && lesson.roster.length > 0) {
      for (const student of lesson.roster) {
        if (student?.id) studentIds.add(student.id);
      }
    } else {
      fallbackRosterCount += Number(lesson.rosterCount || 0);
    }
  }

  return {
    lessonCount: lessons.length,
    classCount: classIds.size,
    studentCount: studentIds.size || fallbackRosterCount,
    nextLesson: lessons[0] || null,
  };
}

export async function getTeacherDashboardData(onDate, requestFn) {
  const lessons = await listTeacherLessons(onDate, requestFn);
  return {
    lessons,
    summary: buildTeacherDashboardSummary(lessons),
  };
}

export function peekTeacherDashboardData(onDate) {
  const lessons = peekTeacherLessons(onDate);
  if (!lessons) {
    return null;
  }

  return {
    lessons,
    summary: buildTeacherDashboardSummary(lessons),
  };
}

export async function saveTeacherAttendance({ lessonId, date, statuses }, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn('/api/teacher/attendance', {
    method: 'POST',
    body: JSON.stringify({
      lessonId,
      date,
      statuses,
    }),
  });
  invalidateReadMostlyCache('teacher:lessons:');
  return payload;
}

function buildTeacherResultRow(row) {
  const score = row?.score == null ? null : Number(row.score);
  const maxMarks = Number(row?.assignments?.total_marks || 0);
  const studentName = row?.student
    ? [row.student.first_name, row.student.last_name].filter(Boolean).join(' ').trim() || row.student.email || 'Student'
    : 'Student';

  return {
    id: row?.id,
    assignmentId: row?.assignment_id || null,
    studentId: row?.student_id || null,
    studentName,
    studentEmail: row?.student?.email || null,
    assignmentTitle: row?.assignments?.title || 'Assignment',
    className: row?.assignments?.classes?.name || 'Class',
    subjectName: row?.assignments?.subjects?.name || 'Subject',
    score,
    maxMarks,
    percentage: score != null && maxMarks > 0 ? Math.round((score / maxMarks) * 100) : null,
    grade: row?.grade || null,
    publishStatus: row?.publish_status || (row?.published_at ? 'published' : 'draft'),
    publishedAt: row?.published_at || null,
    submittedAt: row?.submitted_at || null,
  };
}

export async function listTeacherResults(requestFn) {
  return readThroughReadMostlyCache('teacher:results', async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn('/api/teacher/results');
    return (payload?.data || []).map(buildTeacherResultRow);
  });
}

export function peekTeacherResults() {
  return peekReadMostlyCacheValue('teacher:results');
}

export async function publishTeacherResults({ assignmentId, resultIds }, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn('/api/teacher/results-publish', {
    method: 'POST',
    body: JSON.stringify({
      ...(assignmentId ? { assignmentId } : {}),
      ...(Array.isArray(resultIds) && resultIds.length ? { resultIds } : {}),
    }),
  });
  invalidateReadMostlyCache('teacher:results');
  return payload;
}

export async function listResults(classSubjectId) {
  const client = await requireSupabaseClient();
  const { data, error } = await client
    .from('results')
    .select('*')
    .eq('class_subject_id', classSubjectId);

  if (error) throw error;
  return data || [];
}

export async function upsertResultsBulk(rows) {
  const client = await requireSupabaseClient();
  const { data, error } = await client.rpc('upsert_results_bulk', {
    p_rows: rows,
  });

  if (error) throw error;
  return data;
}
