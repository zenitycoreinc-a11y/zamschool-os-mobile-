import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const teacherDashboardSource = readFileSync(projectPath("src", "screens", "TeacherDashboardScreen.js"), "utf8");
const teacherResultsSource = readFileSync(projectPath("src", "screens", "teacher", "TeacherResultsScreen.js"), "utf8");
const parentAttendanceSource = readFileSync(projectPath("src", "screens", "parent", "ParentAttendanceScreen.js"), "utf8");
const parentShellSource = readFileSync(projectPath("src", "screens", "ParentShellScreen.js"), "utf8");

test("warm-start screens seed from cached read-mostly data before falling back to blocking loaders", () => {
  assert.equal(teacherDashboardSource.includes("peekAnnouncements"), true);
  assert.equal(teacherDashboardSource.includes("peekTeacherDashboardData"), true);
  assert.equal(teacherDashboardSource.includes("if (isLoading && !data) return <LoadingState />;"), true);

  assert.equal(teacherResultsSource.includes("peekTeacherResults"), true);
  assert.equal(teacherResultsSource.includes("if (isLoading && !rows) return <LoadingState />;"), true);

  assert.equal(parentAttendanceSource.includes("peekParentAttendance"), true);
  assert.equal(parentAttendanceSource.includes("if (isLoading && !data) return <LoadingState />;"), true);

  assert.equal(parentShellSource.includes("peekParentProgressSummary"), true);
  assert.equal(parentShellSource.includes("peekAnnouncements"), true);
});
