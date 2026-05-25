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
  assert.equal(source.includes("if (isLoading && !data) return <LoadingState />;"), false);
});

test("student shell mounts tabs lazily and keeps revisited tabs warm", () => {
  assert.equal(source.includes("setVisitedTabs(prev => prev.includes(nextTab) ? prev : [...prev, nextTab])"), true);
  assert.equal(source.includes("visitedTabs.map(tab => ("), true);
  assert.equal(source.includes("style={[styles.tabPane, { display: activeTab === tab ? 'flex' : 'none' }]}"), true);
});

test("student results metrics use the guarded current summary object during warm starts", () => {
  assert.equal(source.includes("const currentDashboard = useMemo(() => dashboard || buildStudentDashboardViewModel({}), [dashboard]);"), true);
});
