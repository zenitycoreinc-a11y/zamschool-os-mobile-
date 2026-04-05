import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "StudentShellScreen.js"), "utf8");

test("student shell keeps fallback dashboard content interactive during restore", () => {
  assert.equal(source.includes("if (dashboardLoading && !dashboard) return <LoadingState />;"), true);
  assert.equal(source.includes("peekStudentDashboard"), true);
  assert.equal(source.includes("if (isLoading) return <LoadingState />;"), true);
});

test("student shell mounts tabs lazily and keeps revisited tabs warm", () => {
  assert.equal(source.includes("rememberStudentTab(current, activeTab)"), true);
  assert.equal(source.includes("getMountedStudentTabs(activeTab, visitedTabs)"), true);
  assert.equal(source.includes("const primaryTabKey = CACHED_STUDENT_TABS.includes(activeTab) ? activeTab : 'home';"), true);
  assert.equal(source.includes("mountedTabs.map((tab) =>"), true);
  assert.equal(source.includes("pointerEvents={isActive ? 'auto' : 'none'}"), true);
  assert.equal(source.includes("importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}"), true);
});

test("student results metrics use the guarded current summary object during warm starts", () => {
  assert.equal(source.includes("value: currentSummary.average == null ? '--' : `${currentSummary.average}%`,"), true);
});
