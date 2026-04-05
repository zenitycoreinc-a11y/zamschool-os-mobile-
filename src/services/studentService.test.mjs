import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { __resetReadMostlyCacheForTests } from "./readMostlyCache.js";
import { buildStudentResultsRows } from "./studentResults.js";
import { getStudentResultsSummary, peekStudentResultsSummary } from "./studentService.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const studentServiceSource = readFileSync(path.join(dirname, "studentService.js"), "utf8");

test.beforeEach(() => {
  __resetReadMostlyCacheForTests();
});

test("buildStudentResultsRows resolves subjects and total marks from assignments", () => {
  const rows = buildStudentResultsRows(
    [
      {
        id: "result-1",
        assignment_id: "assignment-1",
        score: "82",
        grade: "B",
        created_at: "2026-03-21T10:00:00Z",
      },
    ],
    [
      {
        id: "assignment-1",
        subject_id: "subject-1",
        title: "English Comprehension Test",
        total_marks: 100,
      },
    ],
    [
      {
        id: "subject-1",
        name: "English",
        code: "ENG",
      },
    ]
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].subject, "English");
  assert.equal(rows[0].score, 82);
  assert.equal(rows[0].maxScore, 100);
  assert.equal(rows[0].percentage, 82);
});

test("buildStudentResultsRows falls back to assignment title when no subject exists", () => {
  const rows = buildStudentResultsRows(
    [
      {
        id: "result-1",
        assignment_id: "assignment-1",
        score: 18,
        created_at: "2026-03-21T10:00:00Z",
      },
    ],
    [
      {
        id: "assignment-1",
        subject_id: null,
        title: "Science Observation Sheet",
        total_marks: 20,
      },
    ],
    []
  );

  assert.equal(rows[0].subject, "Science Observation Sheet");
  assert.equal(rows[0].percentage, 90);
});

test("getStudentResultsSummary reads the shared student results endpoint and keeps published-only rows", async () => {
  const calls = [];

  const summary = await getStudentResultsSummary(40, async (path) => {
    calls.push(path);
    return {
      data: [
        {
          id: "result-1",
          assignmentTitle: "English Comprehension Test",
          subjectName: "English",
          className: "Grade 7A",
          score: 82,
          grade: "B",
          published_at: "2026-03-23T12:00:00Z",
        },
      ],
    };
  });

  assert.deepEqual(calls, ["/api/student/results"]);
  assert.equal(summary.average, 82);
  assert.equal(summary.rows.length, 1);
  assert.equal(summary.rows[0].subject, "English");
  assert.equal(summary.rows[0].percentage, 82);
});

test("getStudentResultsSummary reuses cached rows for warm result-tab restores", async () => {
  const calls = [];
  const requestFn = async (path) => {
    calls.push(path);
    return {
      data: [
        {
          id: "result-1",
          assignmentTitle: "English Comprehension Test",
          subjectName: "English",
          className: "Grade 7A",
          score: 82,
          grade: "B",
          published_at: "2026-03-23T12:00:00Z",
        },
      ],
    };
  };

  const first = await getStudentResultsSummary(40, requestFn);
  const second = await getStudentResultsSummary(40, requestFn);

  assert.deepEqual(calls, ["/api/student/results"]);
  assert.deepEqual(second, first);
  assert.deepEqual(peekStudentResultsSummary(40), first);
});

test("student library access no longer falls back to an unscoped broad query", () => {
  assert.equal(studentServiceSource.includes("const broadRes"), false);
  assert.equal(
    studentServiceSource.includes("client.from(table).select('*').order('created_at', { ascending: false }).limit(limit)"),
    false
  );
});
