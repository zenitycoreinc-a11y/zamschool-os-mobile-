async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

export async function getAdminManagementDirectory(requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn('/api/admin/relationships');
  return payload?.data || {
    students: [],
    teachers: [],
    parents: [],
    classes: [],
  };
}

export async function createAdminClass(input, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  return resolvedRequestFn('/api/admin/classes', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      capacity: input.capacity || 30,
      supervisorId: input.supervisorId || null,
    }),
  });
}

export async function assignStudentClass(input, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  return resolvedRequestFn('/api/admin/relationships', {
    method: 'POST',
    body: JSON.stringify({
      action: 'assign_student_class',
      studentProfileId: input.studentProfileId,
      classId: input.classId || null,
    }),
  });
}

export async function assignClassSupervisor(input, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  return resolvedRequestFn('/api/admin/relationships', {
    method: 'POST',
    body: JSON.stringify({
      action: 'assign_class_supervisor',
      classId: input.classId,
      supervisorId: input.supervisorId || null,
    }),
  });
}

export async function linkParentStudent(input, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  return resolvedRequestFn('/api/admin/relationships', {
    method: 'POST',
    body: JSON.stringify({
      action: 'link_parent_student',
      parentProfileId: input.parentProfileId,
      studentProfileId: input.studentProfileId,
    }),
  });
}

export async function unlinkParentStudent(input, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  return resolvedRequestFn('/api/admin/relationships', {
    method: 'POST',
    body: JSON.stringify({
      action: 'unlink_parent_student',
      parentProfileId: input.parentProfileId,
      studentProfileId: input.studentProfileId,
    }),
  });
}
