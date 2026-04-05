import {
  peekReadMostlyCacheValue,
  readThroughReadMostlyCache,
} from './readMostlyCache.js';

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getMyStudentId(client) {
  const { data: studentId, error } = await client.rpc('get_my_student_id');
  if (!error && studentId) return studentId;

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr) throw userErr;
  return user?.id || null;
}

async function getStudentDashboardResource() {
  const { getStudentDashboard } = await import('./studentDashboardService.js');
  return getStudentDashboard;
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function buildPublishedStudentResultRows(resultRows = []) {
  return (resultRows || []).map((row) => {
    const score = row?.score == null ? null : Number(row.score);
    const maxScore = Number(row?.maxScore || row?.totalMarks || 100);
    const percentage =
      score == null ? 0 : maxScore > 0 ? Math.round((score / maxScore) * 100) : score;

    return {
      id: row?.id || `${row?.assignmentTitle || 'result'}-${row?.published_at || row?.publishedAt || Math.random()}`,
      subject: row?.subjectName || row?.subject || 'Subject',
      score: score == null ? 0 : score,
      maxScore,
      percentage,
      grade: row?.grade || null,
      date: row?.published_at || row?.publishedAt || null,
      assignmentTitle: row?.assignmentTitle || 'Result',
      className: row?.className || 'Class',
    };
  });
}

export async function getStudentResultsSummary(limit = 40, requestFn) {
  const safeLimit = Number(limit || 40);

  return readThroughReadMostlyCache(`student:results:${safeLimit}`, async () => {
    const resolvedRequestFn = requestFn || (await getApiRequest());
    const payload = await resolvedRequestFn('/api/student/results');
    const rows = buildPublishedStudentResultRows((payload?.data || []).slice(0, safeLimit));
    const average = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.percentage, 0) / rows.length) : null;
    return { average, rows };
  });
}

export function peekStudentResultsSummary(limit = 40) {
  return peekReadMostlyCacheValue(`student:results:${Number(limit || 40)}`);
}

function mapMaterialRow(row) {
  return {
    id: row.id || `${row.title || row.name || 'item'}-${row.created_at || Math.random()}`,
    title: row.title || row.name || row.topic || 'Learning material',
    subject: row.subject_name || row.subject || row.category || 'General',
    type: row.file_type || row.type || 'Resource',
    link: row.file_url || row.url || row.link || null,
    createdAt: row.created_at || row.updated_at || null,
  };
}

export async function getStudentLibraryItems(limit = 30) {
  const client = await requireSupabaseClient();
  const studentId = await getMyStudentId(client);
  if (!studentId) {
    return [];
  }
  
  // Optimized: Select only required columns instead of '*'
  const tableCandidates = ['materials', 'library_materials', 'resources', 'learning_materials'];
  const selectColumns = 'id, title, name, topic, subject_name, subject, category, file_type, type, file_url, url, link, created_at, updated_at';

  for (const table of tableCandidates) {
    const scopedRes = await client
      .from(table)
      .select(selectColumns)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!scopedRes.error) {
      return (scopedRes.data || []).map(mapMaterialRow);
    }
  }

  return [];
}

export async function getStudentTodayLessons() {
  const getStudentDashboard = await getStudentDashboardResource();
  const dashboard = await getStudentDashboard();
  return (dashboard.todayLessons || []).map((lesson) => ({
    id: lesson.id,
    time: lesson.timeLabel,
    subject: lesson.subjectName,
    teacher: lesson.teacherName,
    room: lesson.room,
    active: lesson.isCurrent === true,
  }));
}

export async function getStudentUpcomingDeadlines() {
  const getStudentDashboard = await getStudentDashboardResource();
  const dashboard = await getStudentDashboard();
  return (dashboard.upcomingAssignments || []).map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    subject: assignment.subjectName,
    due: assignment.dueDate,
    urgent: assignment.urgent === true,
  }));
}
