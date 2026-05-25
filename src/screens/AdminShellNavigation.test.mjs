import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "AdminShellScreen.js"), "utf8");

test("admin shell uses operations-first bottom navigation with overview, roll call, people, and inbox", () => {
  assert.equal(source.includes("const bottomTabs = ["), true);
  assert.equal(source.includes("{ key: 'overview', label: 'Overview', icon: 'home' }"), true);
  assert.equal(source.includes("{ key: 'rollcall', label: 'Roll Call', icon: 'clipboard' }"), true);
  assert.equal(source.includes("{ key: 'people', label: 'People', icon: 'users' }"), true);
  assert.equal(source.includes("{ key: 'notifications', label: 'Inbox', icon: 'inbox' }"), true);
  assert.equal(source.includes("bottomTabs={bottomTabs}"), true);
});

test("admin shell keeps the management tab usable through a stable web-first holding view", () => {
  assert.equal(source.includes("function AdminManagementHoldingScreen()"), true);
  assert.equal(
    source.includes("Relationship management stays web-first while the mobile admin operations view is being rebuilt."),
    true,
  );
});

test("admin shell wires dedicated roll call and people screens", () => {
  assert.equal(
    source.includes("import { AdminRollCallMonitorScreen } from './admin/AdminRollCallMonitorScreen';"),
    true,
  );
  assert.equal(
    source.includes("import { AdminPeopleScreen } from './admin/AdminPeopleScreen';"),
    true,
  );
  assert.equal(source.includes("case 'rollcall':"), true);
  assert.equal(source.includes("case 'people':"), true);
});

test("admin shell keeps primary operations tabs warm and leaves secondary routes on demand", () => {
  assert.equal(source.includes("rememberRoleTab(current, tab, primaryTabs)"), true);
  assert.equal(source.includes("getMountedRoleTabs(tab, visitedTabs, primaryTabs)"), true);
  assert.equal(source.includes("mountedTabs.map((mountedTab) =>"), true);
  assert.equal(source.includes("isActive ? 'auto' : 'none'"), true);
});
