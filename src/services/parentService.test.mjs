import test from "node:test";
import assert from "node:assert/strict";

import { __resetReadMostlyCacheForTests } from "./readMostlyCache.js";
import {
  buildParentHomeSummary,
  buildParentProgressFromApi,
  buildParentProgressViewModel,
  countLinkedParentStudents,
  getParentAttendance,
  getParentProgressSummary,
  pickFirstPopulatedFeeRows,
  peekParentAttendance,
  peekParentProgressSummary,
} from "./parentService.js";

test.beforeEach(() => {
  __resetReadMostlyCacheForTests();
});

test("getParentAttendance reads the shared parent attendance endpoint with an optional child filter", async () => {
  const calls = [];
  const attendance = await getParentAttendance(
    {
      range: "1m",
      studentId: "student-1",
    },
    async (path) => {
      calls.push(path);
      return {
        data: {
          range: "1m",
          startDate: "2026-02-20",
          endDate: "2026-03-20",
          summary: {
            PRESENT: 4,
            ABSENT: 1,
            LATE: 1,
            EXCUSED: 0,
          },
          children: [
            {
              id: "student-1",
              displayName: "Mary Banda",
              relationship: "mother",
              summary: {
                PRESENT: 4,
                ABSENT: 1,
                LATE: 1,
                EXCUSED: 0,
              },
            },
          ],
          rows: [
            {
              id: "attendance-1",
              studentId: "student-1",
              studentName: "Mary Banda",
              subjectName: "Mathematics",
              className: "Grade 7 - A",
              teacherName: "Mr Banda",
              date: "2026-03-20",
              startTime: "08:00:00",
              endTime: "08:40:00",
              status: "LATE",
            },
          ],
        },
      };
    }
  );

  assert.deepEqual(calls, ["/api/parent/attendance?range=1m&studentId=student-1"]);
  assert.equal(attendance.summary.PRESENT, 4);
  assert.equal(attendance.children[0].displayName, "Mary Banda");
  assert.equal(attendance.rows[0].status, "LATE");
  assert.deepEqual(peekParentAttendance({ range: "1m", studentId: "student-1" }), attendance);
});

test("buildParentHomeSummary keeps neutral zero values when parent dashboard counts are missing", () => {
  const summary = buildParentHomeSummary({});

  assert.equal(summary.childrenCount, 0);
  assert.equal(summary.unreadMessages, 0);
  assert.equal(summary.announcementsCount, 0);
  assert.equal(summary.childrenNote, "No children linked yet");
  assert.equal(summary.messagesNote, "No unread messages");
  assert.equal(summary.noticesNote, "No notices published");
});

test("buildParentProgressViewModel maps student row ids back to child names", () => {
  const summary = buildParentProgressViewModel({
    studentRows: [
      { id: "student-row-1", profile_id: "profile-1" },
      { id: "student-row-2", profile_id: "profile-2" },
    ],
    profileRows: [
      { id: "profile-1", first_name: "Mary", last_name: "Banda" },
      { id: "profile-2", first_name: "John", last_name: "Zulu" },
    ],
    attendanceRows: [
      { student_id: "student-row-1", status: "present" },
      { student_id: "student-row-2", status: "absent" },
      { student_id: "student-row-2", status: "late" },
    ],
    resultsRows: [
      { student_id: "student-row-2", score: "76", created_at: "2026-03-21T10:00:00Z" },
      { student_id: "student-row-1", score: 91, created_at: "2026-03-20T10:00:00Z" },
    ],
  });

  assert.equal(summary.linkedChildren.length, 2);
  assert.equal(summary.linkedChildren[0].name, "Mary Banda");
  assert.equal(summary.attendanceRate, 67);
  assert.equal(summary.latestResults[0].studentName, "John Zulu");
  assert.equal(summary.latestResults[0].score, 76);
});

test("countLinkedParentStudents counts links for both parent record ids and parent profile ids", () => {
  const count = countLinkedParentStudents(
    [
      { parent_id: "parent-record-1", student_id: "student-1" },
      { parent_id: "parent-profile-1", student_id: "student-2" },
      { parent_id: "parent-profile-1", student_id: "student-2" },
      { parent_id: "other-parent", student_id: "student-3" },
    ],
    ["parent-record-1", "parent-profile-1"]
  );

  assert.equal(count, 2);
});

test("pickFirstPopulatedFeeRows skips empty successful tables and keeps the first table with records", () => {
  const rows = pickFirstPopulatedFeeRows([
    { table: "fee_records", rows: [] },
    { table: "fees", rows: [{ id: "fee-1", amount: 1200 }] },
    { table: "payments", rows: [{ id: "fee-2", amount: 800 }] },
  ]);

  assert.deepEqual(rows, [{ id: "fee-1", amount: 1200 }]);
});

test("buildParentProgressFromApi keeps child attendance and latest result data scoped per child", () => {
  const summary = buildParentProgressFromApi({
    children: [
      { id: "student-1", displayName: "Mary Banda" },
      { id: "student-2", displayName: "John Zulu" },
    ],
    attendanceRows: [
      { studentId: "student-1", status: "PRESENT" },
      { studentId: "student-1", status: "PRESENT" },
      { studentId: "student-2", status: "ABSENT" },
      { studentId: "student-2", status: "LATE" },
    ],
    resultsRows: [
      {
        id: "result-1",
        studentId: "student-1",
        studentName: "Mary Banda",
        score: 91,
        publishedAt: "2026-03-23T12:00:00Z",
      },
      {
        id: "result-2",
        studentId: "student-2",
        studentName: "John Zulu",
        score: 76,
        publishedAt: "2026-03-24T12:00:00Z",
      },
    ],
  });

  assert.equal(summary.attendanceRate, 75);
  assert.deepEqual(summary.linkedChildren, [
    {
      id: "student-1",
      profileId: null,
      name: "Mary Banda",
      attendanceRate: 100,
      latestResult: {
        score: 91,
        createdAt: "2026-03-23T12:00:00Z",
      },
    },
    {
      id: "student-2",
      profileId: null,
      name: "John Zulu",
      attendanceRate: 50,
      latestResult: {
        score: 76,
        createdAt: "2026-03-24T12:00:00Z",
      },
    },
  ]);
});

test("getParentProgressSummary uses shared parent APIs for children attendance and published results", async () => {
  const calls = [];

  const summary = await getParentProgressSummary(async (path) => {
    calls.push(path);

    if (path === "/api/parent/children") {
      return {
        data: [
          {
            id: "student-row-1",
            displayName: "Mary Banda",
            admissionNumber: "ADM-1",
          },
        ],
      };
    }

    if (path === "/api/parent/attendance?range=1m") {
      return {
        data: {
          summary: {
            PRESENT: 4,
            ABSENT: 1,
            LATE: 1,
            EXCUSED: 0,
          },
          children: [
            {
              id: "student-row-1",
              displayName: "Mary Banda",
              admissionNumber: "ADM-1",
            },
          ],
          rows: [
            { studentId: "student-row-1", status: "PRESENT" },
            { studentId: "student-row-1", status: "ABSENT" },
            { studentId: "student-row-1", status: "LATE" },
          ],
        },
      };
    }

    if (path === "/api/parent/results") {
      return {
        data: [
          {
            id: "result-1",
            studentId: "student-row-1",
            studentName: "Mary Banda",
            score: 91,
            publishedAt: "2026-03-23T12:00:00Z",
          },
        ],
      };
    }

    throw new Error(`Unexpected path: ${path}`);
  });

  assert.deepEqual(calls, [
    "/api/parent/children",
    "/api/parent/attendance?range=1m",
    "/api/parent/results",
  ]);
  assert.equal(summary.linkedChildren.length, 1);
  assert.equal(summary.attendanceRate, 67);
  assert.equal(summary.latestResults[0].studentName, "Mary Banda");
  assert.equal(summary.latestResults[0].score, 91);
});

test("getParentProgressSummary reuses a short-lived cached summary for quick tab returns", async () => {
  const calls = [];
  const requestFn = async (path) => {
    calls.push(path);

    if (path === "/api/parent/children") {
      return { data: [{ id: "student-row-1", displayName: "Mary Banda" }] };
    }

    if (path === "/api/parent/attendance?range=1m") {
      return {
        data: {
          children: [{ id: "student-row-1", displayName: "Mary Banda" }],
          rows: [{ studentId: "student-row-1", status: "PRESENT" }],
        },
      };
    }

    if (path === "/api/parent/results") {
      return {
        data: [
          {
            id: "result-1",
            studentId: "student-row-1",
            studentName: "Mary Banda",
            score: 88,
            publishedAt: "2026-03-23T12:00:00Z",
          },
        ],
      };
    }

    throw new Error(`Unexpected path: ${path}`);
  };

  const first = await getParentProgressSummary(requestFn);
  const second = await getParentProgressSummary(requestFn);

  assert.equal(calls.length, 3);
  assert.deepEqual(second, first);
  assert.deepEqual(peekParentProgressSummary(), first);
});
