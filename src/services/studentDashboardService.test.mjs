import test from "node:test";
import assert from "node:assert/strict";

import { __resetReadMostlyCacheForTests } from "./readMostlyCache.js";
import {
  buildStudentDashboardViewModel,
  getStudentDashboard,
  peekStudentDashboard,
} from "./studentDashboardService.js";

test.beforeEach(() => {
  __resetReadMostlyCacheForTests();
});

test("buildStudentDashboardViewModel maps backend student dashboard payloads into the mobile view model", () => {
  const viewModel = buildStudentDashboardViewModel({
    profile: {
      id: "student-1",
      fullName: "Mary Banda",
      email: "mary@example.com",
      admissionNumber: "ADM-001",
      classId: "class-1",
      className: "7A",
      gradeLabel: "Grade 7",
    },
    todayLessons: [
      {
        id: "lesson-1",
        subjectName: "Mathematics",
        teacherName: "Mr Banda",
        className: "Grade 7 - 7A",
        room: "A1",
        startTime: "08:00:00",
        endTime: "08:40:00",
        isCurrent: true,
      },
    ],
    attendance: {
      summary: {
        PRESENT: 8,
        ABSENT: 1,
        LATE: 1,
        EXCUSED: 0,
        total: 10,
        rate: 90,
      },
      rows: [
        {
          id: "attendance-1",
          date: "2026-03-21",
          status: "LATE",
          subjectName: "Mathematics",
          className: "Grade 7 - 7A",
          teacherName: "Mr Banda",
          startTime: "08:00:00",
          endTime: "08:40:00",
        },
      ],
    },
    assignments: {
      total: 2,
      urgent: 1,
      rows: [
        {
          id: "assignment-1",
          title: "Algebra Worksheet",
          subjectName: "Mathematics",
          teacherName: "Mr Banda",
          dueDate: "2026-03-22",
          urgent: true,
        },
      ],
    },
  });

  assert.equal(viewModel.profile.displayName, "Mary Banda");
  assert.equal(viewModel.profile.classLabel, "Grade 7 - 7A");
  assert.equal(viewModel.metrics.attendance.value, "90%");
  assert.equal(viewModel.metrics.assignments.value, "2");
  assert.equal(viewModel.metrics.lessons.value, "1");
  assert.equal(viewModel.todayLessons[0].timeLabel, "08:00 - 08:40");
  assert.equal(viewModel.todayLessons[0].statusLabel, "Now");
  assert.equal(viewModel.upcomingAssignments[0].teacherName, "Mr Banda");
  assert.equal(viewModel.attendance.rows[0].status, "late");
});

test("buildStudentDashboardViewModel returns neutral fallback values when the student has no class or rollcall data", () => {
  const viewModel = buildStudentDashboardViewModel({});

  assert.equal(viewModel.profile.displayName, "Student");
  assert.equal(viewModel.profile.classLabel, "No class assigned");
  assert.equal(viewModel.profile.admissionLabel, "No admission number");
  assert.equal(viewModel.metrics.attendance.value, "0%");
  assert.equal(viewModel.metrics.attendance.note, "No attendance yet");
  assert.equal(viewModel.metrics.assignments.value, "0");
  assert.equal(viewModel.metrics.assignments.note, "No assignments yet");
  assert.equal(viewModel.metrics.lessons.value, "0");
  assert.equal(viewModel.metrics.lessons.note, "No timetable assigned");
  assert.deepEqual(viewModel.todayLessons, []);
  assert.deepEqual(viewModel.upcomingAssignments, []);
  assert.equal(viewModel.attendance.summary.PRESENT, 0);
  assert.equal(viewModel.attendance.summary.rate, 0);
});

test("getStudentDashboard reads the shared student dashboard endpoint", async () => {
  const calls = [];

  const viewModel = await getStudentDashboard(async (path) => {
    calls.push(path);
    return {
      data: {
        profile: {
          fullName: "Mary Banda",
          className: "7A",
          gradeLabel: "Grade 7",
        },
      },
    };
  });

  assert.deepEqual(calls, ["/api/student/dashboard"]);
  assert.equal(viewModel.profile.classLabel, "Grade 7 - 7A");
});

test("getStudentDashboard reuses a short-lived cached payload for quick shell revisits", async () => {
  const calls = [];
  const requestFn = async (path) => {
    calls.push(path);
    return {
      data: {
        profile: {
          fullName: "Mary Banda",
          className: "7A",
          gradeLabel: "Grade 7",
        },
      },
    };
  };

  const first = await getStudentDashboard(requestFn);
  const second = await getStudentDashboard(requestFn);

  assert.deepEqual(calls, ["/api/student/dashboard"]);
  assert.deepEqual(second, first);
  assert.deepEqual(peekStudentDashboard(), first);
});
