import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "ParentShellScreen.js"), "utf8");

test("parent shell keeps bottom navigation and exposes inbox plus profile from the shared shell", () => {
  assert.equal(source.includes("const bottomTabs = ["), true);
  assert.equal(source.includes("{ key: 'messages', label: 'Inbox', icon: 'message-circle' }"), true);
  assert.equal(source.includes("{ key: 'fees', label: 'Fees', icon: 'credit-card' }"), true);
  assert.equal(source.includes("bottomTabs={bottomTabs}"), true);
});

test("parent shell enriches drawer items and embeds parent sub-screens instead of hiding legacy headers", () => {
  assert.equal(source.includes("description:"), true);
  assert.equal(source.includes("showHeader={false}"), false);
  assert.equal(source.includes("embedded"), true);
  assert.equal(source.includes("{ key: 'notifications', label: 'Notifications', icon: 'bell'"), true);
});

test("parent shell keeps primary tabs warm without keeping secondary routes mounted forever", () => {
  assert.equal(source.includes("rememberRoleTab(current, activeTab, primaryTabs)"), true);
  assert.equal(source.includes("getMountedRoleTabs(activeTab, visitedTabs, primaryTabs)"), true);
  assert.equal(source.includes("mountedTabs.map((tab) =>"), true);
  assert.equal(source.includes("importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}"), true);
});
