import test from "node:test";
import assert from "node:assert/strict";

import {
  getAdminPeopleDirectory,
  getAdminPersonDetail,
} from "./adminPeopleService.js";

test("getAdminPeopleDirectory groups relationship data into mobile people rows", async () => {
  const directory = await getAdminPeopleDirectory({
    requestFn: async (path) => {
      assert.equal(path, "/api/admin/relationships");
      return {
        data: {
          students: [
            {
              profileId: "student-profile-1",
              displayName: "Demo Student One",
              email: "student1@gmail.com",
              admissionNumber: "ADM-001",
              className: "Grade 7 A",
            },
          ],
          teachers: [
            {
              profileId: "teacher-profile-1",
              displayName: "Demo Teacher One",
              email: "teacher1@gmail.com",
              employeeId: "EMP-001",
            },
          ],
          parents: [
            {
              profileId: "parent-profile-1",
              displayName: "Demo Parent One",
              email: "parent1@gmail.com",
              linkedStudentProfileIds: ["student-profile-1", "student-profile-2"],
            },
          ],
        },
      };
    },
  });

  assert.deepEqual(directory.rows, [
    {
      id: "student-profile-1",
      role: "student",
      fullName: "Demo Student One",
      email: "student1@gmail.com",
      summary: "Grade 7 A",
      secondary: "ADM-001",
    },
    {
      id: "teacher-profile-1",
      role: "teacher",
      fullName: "Demo Teacher One",
      email: "teacher1@gmail.com",
      summary: "Teacher account",
      secondary: "EMP-001",
    },
    {
      id: "parent-profile-1",
      role: "parent",
      fullName: "Demo Parent One",
      email: "parent1@gmail.com",
      summary: "2 linked children",
      secondary: "Parent account",
    },
  ]);
});

test("getAdminPeopleDirectory preserves a visible error signal when the directory request fails", async () => {
  const directory = await getAdminPeopleDirectory({
    requestFn: async () => {
      throw new Error("Network request failed");
    },
  });

  assert.equal(directory.notice, "People directory is temporarily unavailable on mobile.");
  assert.equal(directory.errorMessage, "Network request failed");
  assert.deepEqual(directory.rows, []);
});

test("getAdminPersonDetail shapes student details into a shared full-screen sheet payload", async () => {
  const detail = await getAdminPersonDetail("student-profile-1", {
    requestFn: async (path) => {
      assert.equal(path, "/api/admin/users?profileId=student-profile-1");
      return {
        data: {
          id: "student-profile-1",
          role: "student",
          fullName: "Demo Student One",
          email: "student1@gmail.com",
          avatarUrl: null,
          student: {
            admissionNumber: "ADM-001",
            className: "Grade 7 A",
            attendanceSummary: {
              present: 28,
              absent: 2,
              sick: 1,
              late: 1,
            },
            feeSummary: {
              balance: 450,
              currency: "ZMW",
            },
            linkedParents: [{ fullName: "Demo Parent One" }],
            latestResults: [{ subjectName: "Mathematics", score: 82, grade: "B+" }],
          },
        },
      };
    },
  });

  assert.equal(detail.eyebrow, "Student");
  assert.equal(detail.title, "Demo Student One");
  assert.deepEqual(detail.metadataItems, [
    { label: "Class", value: "Grade 7 A" },
    { label: "Admission", value: "ADM-001" },
    { label: "Fee balance", value: "ZMW 450" },
  ]);
  assert.equal(detail.sections[0].title, "Attendance");
  assert.deepEqual(detail.sections[0].items, [
    { label: "Present", value: "28" },
    { label: "Absent", value: "2" },
    { label: "Sick", value: "1" },
    { label: "Late", value: "1" },
  ]);
  assert.equal(detail.sections[1].title, "Family");
  assert.deepEqual(detail.sections[1].items, [{ label: "Linked parent", value: "Demo Parent One" }]);
});

test("getAdminPersonDetail shapes teacher and parent role details with role-specific sections", async () => {
  const teacherDetail = await getAdminPersonDetail("teacher-profile-1", {
    requestFn: async () => ({
      data: {
        id: "teacher-profile-1",
        role: "teacher",
        fullName: "Demo Teacher One",
        email: "teacher1@gmail.com",
        teacher: {
          employeeId: "EMP-001",
          hireDateLabel: "3 years",
          assignedClassesCount: 2,
          subjects: ["Mathematics", "Science"],
        },
      },
    }),
  });

  const parentDetail = await getAdminPersonDetail("parent-profile-1", {
    requestFn: async () => ({
      data: {
        id: "parent-profile-1",
        role: "parent",
        fullName: "Demo Parent One",
        email: "parent1@gmail.com",
        parent: {
          relationType: "Mother",
          linkedChildren: [
            { fullName: "Demo Student One", className: "Grade 7 A" },
            { fullName: "Demo Student Two", className: "Grade 9 C" },
          ],
        },
      },
    }),
  });

  assert.equal(teacherDetail.eyebrow, "Teacher");
  assert.deepEqual(teacherDetail.metadataItems, [
    { label: "Employee", value: "EMP-001" },
    { label: "Time at school", value: "3 years" },
    { label: "Assigned classes", value: "2" },
  ]);
  assert.deepEqual(teacherDetail.sections[0].items, [
    { label: "Subject", value: "Mathematics" },
    { label: "Subject", value: "Science" },
  ]);

  assert.equal(parentDetail.eyebrow, "Parent");
  assert.deepEqual(parentDetail.metadataItems, [
    { label: "Relation", value: "Mother" },
    { label: "Linked children", value: "2" },
  ]);
  assert.deepEqual(parentDetail.sections[0].items, [
    { label: "Child", value: "Demo Student One - Grade 7 A" },
    { label: "Child", value: "Demo Student Two - Grade 9 C" },
  ]);
});

test("getAdminPersonDetail also supports the live admin users route payload shape", async () => {
  const detail = await getAdminPersonDetail("student-profile-1", {
    requestFn: async () => ({
      data: {
        profileId: "student-profile-1",
        role: "student",
        displayName: "Demo Student One",
        email: "student1@gmail.com",
        attendance: {
          present: 28,
          absent: 2,
          sick: 1,
          late: 1,
        },
        finance: {
          balance: 450,
          currency: "ZMW",
        },
        admissionNumber: "ADM-001",
        className: "Grade 7 A",
        guardians: [{ name: "Demo Parent One" }],
        results: {
          rows: [{ subjectName: "Mathematics", score: 82, grade: "B+" }],
        },
      },
    }),
  });

  assert.equal(detail.title, "Demo Student One");
  assert.deepEqual(detail.metadataItems, [
    { label: "Class", value: "Grade 7 A" },
    { label: "Admission", value: "ADM-001" },
    { label: "Fee balance", value: "ZMW 450" },
  ]);
  assert.equal(detail.sections[1].items[0].value, "Demo Parent One");
  assert.equal(detail.sections[2].items[0].value, "82 (B+)");
});
