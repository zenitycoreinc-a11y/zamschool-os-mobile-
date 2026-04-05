import test from "node:test";
import assert from "node:assert/strict";

import { getAdminRollCallMonitor } from "./adminOperationsService.js";

test("getAdminRollCallMonitor rejects unsupported ranges before issuing a request", async () => {
  let callCount = 0;

  await assert.rejects(
    getAdminRollCallMonitor({
      range: "forever",
      requestFn: async () => {
        callCount += 1;
        return {};
      },
    }),
    /Invalid range: forever/
  );

  assert.equal(callCount, 0);
});

test("getAdminRollCallMonitor maps attendance summary payload into class-first mobile operations data", async () => {
  const monitor = await getAdminRollCallMonitor({
    requestFn: async (path) => {
      assert.equal(path, "/api/admin/attendance/summary?range=1w");
      return {
        data: {
          summary: {
            PRESENT: 30,
            ABSENT: 3,
            LATE: 2,
            EXCUSED: 1,
          },
          classBreakdown: [
            {
              id: "class-1",
              name: "Grade 7 A",
              attendanceCount: 12,
              lessonCount: 1,
              summary: { PRESENT: 8, ABSENT: 2, LATE: 1, EXCUSED: 1 },
            },
          ],
          rows: [
            {
              id: "row-1",
              classId: "class-1",
              className: "Grade 7 A",
              studentId: "student-1",
              studentName: "Demo Student One",
              status: "ABSENT",
              remarks: "No report",
            },
            {
              id: "row-2",
              classId: "class-1",
              className: "Grade 7 A",
              studentId: "student-2",
              studentName: "Demo Student Two",
              status: "EXCUSED",
              remarks: "Sick leave",
            },
            {
              id: "row-3",
              classId: "class-1",
              className: "Grade 7 A",
              studentId: "student-3",
              studentName: "Demo Student Three",
              status: "LATE",
              remarks: "Late bus",
            },
          ],
        },
      };
    },
  });

  assert.deepEqual(monitor.summary, {
    missingMorningRollCalls: 3,
    unresolvedMorningRollCalls: 3,
    sickLearners: 1,
    lateLearners: 2,
    presentLearners: 30,
  });

  assert.deepEqual(monitor.classes, [
    {
      id: "class-1",
      name: "Grade 7 A",
      attendanceCount: 12,
      lessonCount: 1,
      missingCount: 2,
      unresolvedCount: 2,
      sickCount: 1,
      lateCount: 1,
      absentStudents: [
        { id: "student-1", name: "Demo Student One", status: "ABSENT", remarks: "No report" },
      ],
      sickStudents: [
        { id: "student-2", name: "Demo Student Two", status: "EXCUSED", remarks: "Sick leave" },
      ],
      lateStudents: [
        { id: "student-3", name: "Demo Student Three", status: "LATE", remarks: "Late bus" },
      ],
    },
  ]);
});

test("getAdminRollCallMonitor preserves a visible error signal when the attendance request fails", async () => {
  const monitor = await getAdminRollCallMonitor({
    requestFn: async () => {
      throw new Error("Network request failed");
    },
  });

  assert.equal(monitor.notice, "Roll-call monitoring is temporarily unavailable on mobile.");
  assert.equal(monitor.errorMessage, "Network request failed");
  assert.deepEqual(monitor.classes, []);
});

test("normalizeAdminRollCallMonitor keeps rows without class ids separated by class name", async () => {
  const monitor = await getAdminRollCallMonitor({
    requestFn: async () => ({
      data: {
        summary: {
          ABSENT: 2,
        },
        classBreakdown: [],
        rows: [
          {
            id: "row-1",
            className: "Grade 7 A",
            studentId: "student-1",
            studentName: "Demo Student One",
            status: "ABSENT",
            remarks: "No report",
          },
          {
            id: "row-2",
            className: "Grade 8 B",
            studentId: "student-2",
            studentName: "Demo Student Two",
            status: "ABSENT",
            remarks: "No report",
          },
        ],
      },
    }),
  });

  assert.deepEqual(
    monitor.classes.map((item) => ({
      id: item.id,
      name: item.name,
      missingCount: item.missingCount,
    })),
    [
      { id: "class-name:grade 7 a", name: "Grade 7 A", missingCount: 1 },
      { id: "class-name:grade 8 b", name: "Grade 8 B", missingCount: 1 },
    ]
  );
});

test("getAdminRollCallMonitor dedupes repeated learner rows inside each class status bucket", async () => {
  const monitor = await getAdminRollCallMonitor({
    requestFn: async () => ({
      data: {
        summary: {
          ABSENT: 2,
        },
        classBreakdown: [
          {
            id: "class-1",
            name: "Grade 7 A",
            summary: { ABSENT: 2 },
          },
        ],
        rows: [
          {
            id: "row-1",
            classId: "class-1",
            className: "Grade 7 A",
            studentId: "student-1",
            studentName: "Demo Student One",
            status: "ABSENT",
            remarks: "No report",
          },
          {
            id: "row-2",
            classId: "class-1",
            className: "Grade 7 A",
            studentId: "student-1",
            studentName: "Demo Student One",
            status: "ABSENT",
            remarks: "No report",
          },
        ],
      },
    }),
  });

  assert.deepEqual(monitor.classes[0].absentStudents, [
    { id: "student-1", name: "Demo Student One", status: "ABSENT", remarks: "No report" },
  ]);
});
