import test from "node:test";
import assert from "node:assert/strict";

import { __resetReadMostlyCacheForTests } from "./readMostlyCache.js";
import {
  buildTeacherDashboardSummary,
  getTeacherDashboardData,
  listTeacherLessons,
  listTeacherResults,
  peekTeacherLessons,
  peekTeacherResults,
  publishTeacherResults,
  saveTeacherAttendance,
} from "./teacherService.js";

test.beforeEach(() => {
  __resetReadMostlyCacheForTests();
});

test("listTeacherLessons reads the shared teacher classes endpoint", async () => {
  const calls = [];
  const lessons = await listTeacherLessons(
    "2026-03-19",
    async (path) => {
      calls.push(path);
      return {
        data: [
          {
            id: "lesson-1",
            date: "2026-03-19",
            classId: "class-1",
            className: "Grade 7A",
            subjectId: "subject-1",
            subjectName: "Mathematics",
            subjectCode: "MTH",
            startTime: "08:00",
            endTime: "08:40",
            room: "A1",
            rosterCount: 1,
            roster: [
              {
                id: "student-1",
                admissionNumber: "ADM-1",
                displayName: "Mary Banda",
                email: "mary@example.com",
                status: "PRESENT",
                remarks: "",
              },
            ],
          },
        ],
      };
    }
  );

  assert.deepEqual(calls, ["/api/teacher/classes?date=2026-03-19"]);
  assert.equal(lessons[0].id, "lesson-1");
  assert.equal(lessons[0].roster[0].status, "PRESENT");
});

test("saveTeacherAttendance posts rollcall to the shared teacher attendance endpoint", async () => {
  const calls = [];

  const payload = await saveTeacherAttendance(
    {
      lessonId: "lesson-1",
      date: "2026-03-19",
      statuses: [
        {
          studentId: "student-1",
          status: "LATE",
          remarks: "Traffic",
        },
      ],
    },
    async (path, options) => {
      calls.push([path, options]);
      return { success: true };
    }
  );

  assert.deepEqual(payload, { success: true });
  assert.deepEqual(calls, [
    [
      "/api/teacher/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          lessonId: "lesson-1",
          date: "2026-03-19",
          statuses: [
            {
              studentId: "student-1",
              status: "LATE",
              remarks: "Traffic",
            },
          ],
        }),
      },
    ],
  ]);
});

test("buildTeacherDashboardSummary derives real class and roster counts from lesson data", () => {
  const summary = buildTeacherDashboardSummary([
    {
      id: "lesson-1",
      classId: "class-1",
      roster: [
        { id: "student-1" },
        { id: "student-2" },
      ],
      rosterCount: 2,
    },
    {
      id: "lesson-2",
      classId: "class-1",
      roster: [
        { id: "student-1" },
        { id: "student-2" },
      ],
      rosterCount: 2,
    },
    {
      id: "lesson-3",
      classId: "class-2",
      roster: [{ id: "student-3" }],
      rosterCount: 1,
    },
  ]);

  assert.equal(summary.lessonCount, 3);
  assert.equal(summary.classCount, 2);
  assert.equal(summary.studentCount, 3);
});

test("getTeacherDashboardData reuses the shared teacher lessons endpoint for dashboard shaping", async () => {
  const dashboard = await getTeacherDashboardData("2026-03-19", async () => ({
    data: [
      {
        id: "lesson-1",
        date: "2026-03-19",
        classId: "class-1",
        className: "Grade 7A",
        subjectId: "subject-1",
        subjectName: "Mathematics",
        startTime: "08:00",
        endTime: "08:40",
        rosterCount: 2,
        roster: [{ id: "student-1" }, { id: "student-2" }],
      },
    ],
  }));

  assert.equal(dashboard.summary.lessonCount, 1);
  assert.equal(dashboard.summary.classCount, 1);
  assert.equal(dashboard.summary.studentCount, 2);
});

test("listTeacherResults reads the shared teacher results endpoint", async () => {
  const calls = [];

  const rows = await listTeacherResults(async (path) => {
    calls.push(path);
    return {
      data: [
        {
          id: "result-1",
          assignment_id: "assignment-1",
          published_at: null,
          publish_status: "draft",
          score: 82,
          grade: "B",
          student: {
            first_name: "Mary",
            last_name: "Banda",
            email: "mary@example.com",
          },
          assignments: {
            title: "English Test",
            total_marks: 100,
            classes: { name: "Grade 7A" },
            subjects: { name: "English" },
          },
          submitted_at: "2026-03-23T10:00:00Z",
        },
      ],
    };
  });

  assert.deepEqual(calls, ["/api/teacher/results"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].publishStatus, "draft");
  assert.equal(rows[0].studentName, "Mary Banda");
});

test("listTeacherLessons reuses a short-lived cached response for quick tab revisits", async () => {
  let callCount = 0;

  const requestFn = async () => {
    callCount += 1;
    return {
      data: [
        {
          id: "lesson-1",
          date: "2026-03-19",
          classId: "class-1",
          className: "Grade 7A",
          subjectId: "subject-1",
          subjectName: "Mathematics",
          startTime: "08:00",
          endTime: "08:40",
          rosterCount: 1,
          roster: [{ id: "student-1" }],
        },
      ],
    };
  };

  const first = await listTeacherLessons("2026-03-19", requestFn);
  const second = await listTeacherLessons("2026-03-19", requestFn);

  assert.equal(callCount, 1);
  assert.deepEqual(second, first);
  assert.deepEqual(peekTeacherLessons("2026-03-19"), first);
});

test("saveTeacherAttendance invalidates cached teacher lessons so fresh rollcall reloads", async () => {
  let lessonCallCount = 0;

  const lessonRequestFn = async () => {
    lessonCallCount += 1;
    return {
      data: [
        {
          id: `lesson-${lessonCallCount}`,
          date: "2026-03-19",
          classId: "class-1",
          className: "Grade 7A",
          subjectId: "subject-1",
          subjectName: "Mathematics",
          startTime: "08:00",
          endTime: "08:40",
          rosterCount: 1,
          roster: [{ id: "student-1" }],
        },
      ],
    };
  };

  await listTeacherLessons("2026-03-19", lessonRequestFn);
  await saveTeacherAttendance(
    {
      lessonId: "lesson-1",
      date: "2026-03-19",
      statuses: [{ studentId: "student-1", status: "PRESENT", remarks: "" }],
    },
    async () => ({ success: true })
  );
  const refreshed = await listTeacherLessons("2026-03-19", lessonRequestFn);

  assert.equal(lessonCallCount, 2);
  assert.equal(refreshed[0].id, "lesson-2");
});

test("publishTeacherResults posts to the shared teacher publish endpoint", async () => {
  const calls = [];

  const payload = await publishTeacherResults(
    { assignmentId: "assignment-1" },
    async (path, options) => {
      calls.push([path, options]);
      return {
        success: true,
        data: {
          publishedCount: 3,
          publishedAt: "2026-03-23T12:00:00Z",
          resultIds: ["result-1", "result-2", "result-3"],
        },
      };
    }
  );

  assert.equal(payload.data.publishedCount, 3);
  assert.deepEqual(calls, [
    [
      "/api/teacher/results-publish",
      {
        method: "POST",
        body: JSON.stringify({ assignmentId: "assignment-1" }),
      },
    ],
  ]);
});

test("listTeacherResults exposes the latest cached teacher result rows for warm tab restores", async () => {
  const rows = await listTeacherResults(async () => ({
    data: [
      {
        id: "result-1",
        assignment_id: "assignment-1",
        publish_status: "draft",
        score: 75,
        student: {
          first_name: "Mary",
          last_name: "Banda",
        },
        assignments: {
          title: "English Test",
          total_marks: 100,
          classes: { name: "Grade 7A" },
          subjects: { name: "English" },
        },
      },
    ],
  }));

  assert.deepEqual(peekTeacherResults(), rows);
});
