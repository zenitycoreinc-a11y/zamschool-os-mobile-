import { requireSupabase } from './supabase';

export async function listTeacherAssignments(limit = 40) {
  const client = await requireSupabase();
  const { data: teacherId, error: teacherErr } = await client.rpc('get_my_teacher_id');
  if (teacherErr) throw teacherErr;
  if (!teacherId) return [];

  const { data, error } = await client
    .from('assignments')
    .select('id, title, description, due_date, class_subject_id, class_subjects(classes(name), subjects(name), teacher_id)')
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).filter((a) => a.class_subjects?.teacher_id === teacherId).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.due_date,
    className: a.class_subjects?.classes?.name || 'Class',
    subjectName: a.class_subjects?.subjects?.name || 'Subject',
  }));
}
