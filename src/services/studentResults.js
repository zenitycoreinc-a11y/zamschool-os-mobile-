function mapResultRow(row, subjectMap) {
  const assignment = row.assignment || null;
  const marks = Number(row.marks_obtained ?? row.score ?? 0);
  const maxScore = Number(row.max_score ?? assignment?.total_marks ?? 100);
  const percentage = maxScore > 0 ? Math.round((marks / maxScore) * 100) : marks;
  const subjectName =
    subjectMap.get(assignment?.subject_id || row.subject_id) ||
    row.subject_name ||
    row.subject ||
    row.subject_code ||
    assignment?.title ||
    'Subject';

  return {
    id: row.id || `${subjectName}-${row.created_at || row.date || Math.random()}`,
    subject: subjectName,
    score: marks,
    maxScore,
    percentage,
    grade: row.grade || null,
    date: row.date || row.created_at || null,
  };
}

export function buildStudentResultsRows(resultRows = [], assignments = [], subjects = []) {
  const assignmentById = new Map((assignments || []).map((row) => [row.id, row]));
  const subjectMap = new Map(
    (subjects || []).map((row) => [row.id, row.name || row.code || 'Subject'])
  );

  return (resultRows || []).map((row) =>
    mapResultRow(
      {
        ...row,
        assignment: assignmentById.get(row.assignment_id) || null,
      },
      subjectMap
    )
  );
}
