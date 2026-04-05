import test from "node:test";
import assert from "node:assert/strict";

import {
  assignClassSupervisor,
  assignStudentClass,
  createAdminClass,
  getAdminManagementDirectory,
  linkParentStudent,
  unlinkParentStudent,
} from "./adminManagementService.js";

test("getAdminManagementDirectory reads the admin relationships directory", async () => {
  const calls = [];
  const data = await getAdminManagementDirectory(async (path, options) => {
    calls.push({ path, options });
    return {
      data: {
        students: [{ profileId: "student-1" }],
        teachers: [{ profileId: "teacher-1" }],
        parents: [{ profileId: "parent-1" }],
        classes: [{ id: "class-1" }],
      },
    };
  });

  assert.deepEqual(calls, [{ path: "/api/admin/relationships", options: undefined }]);
  assert.equal(data.students[0].profileId, "student-1");
  assert.equal(data.teachers[0].profileId, "teacher-1");
  assert.equal(data.parents[0].profileId, "parent-1");
  assert.equal(data.classes[0].id, "class-1");
});

test("admin relationship mutations post the expected backend actions", async () => {
  const calls = [];
  const requestFn = async (path, options) => {
    calls.push({ path, options });
    return { success: true };
  };

  await createAdminClass({ name: "Grade 7 A", capacity: 40, supervisorId: "teacher-1" }, requestFn);
  await assignStudentClass({ studentProfileId: "student-1", classId: "class-1" }, requestFn);
  await assignClassSupervisor({ classId: "class-1", supervisorId: "teacher-1" }, requestFn);
  await linkParentStudent({ parentProfileId: "parent-1", studentProfileId: "student-1" }, requestFn);
  await unlinkParentStudent({ parentProfileId: "parent-1", studentProfileId: "student-1" }, requestFn);

  assert.equal(calls.length, 5);
  assert.equal(calls[0].path, "/api/admin/classes");
  assert.match(calls[0].options.body, /"name":"Grade 7 A"/);
  assert.match(calls[1].options.body, /"action":"assign_student_class"/);
  assert.match(calls[2].options.body, /"action":"assign_class_supervisor"/);
  assert.match(calls[3].options.body, /"action":"link_parent_student"/);
  assert.match(calls[4].options.body, /"action":"unlink_parent_student"/);
});
