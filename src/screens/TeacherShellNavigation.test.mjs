import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "TeacherShellScreen.js"), "utf8");

test("teacher shell uses bottom navigation and exposes results and inbox as primary routes", () => {
  assert.equal(source.includes("const bottomTabs = ["), true);
  assert.equal(source.includes("{ key: 'results', label: 'Results', icon: 'bar-chart-2' }"), true);
  assert.equal(source.includes("{ key: 'messages', label: 'Inbox', icon: 'inbox' }"), true);
  assert.equal(source.includes("bottomTabs={bottomTabs}"), true);
});

test("teacher shell keeps primary tabs warm and renders mounted tab surfaces lazily", () => {
  assert.equal(source.includes("rememberRoleTab(current, tab, primaryTabs)"), true);
  assert.equal(source.includes("getMountedRoleTabs(tab, visitedTabs, primaryTabs)"), true);
  assert.equal(source.includes("mountedTabs.map((mountedTab) =>"), true);
  assert.equal(source.includes("importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}"), true);
});
