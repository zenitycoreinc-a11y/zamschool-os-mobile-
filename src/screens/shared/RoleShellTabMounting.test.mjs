import test from "node:test";
import assert from "node:assert/strict";
import { getMountedRoleTabs, rememberRoleTab } from "./roleShellTabMounting.js";

test("role shell tab mounting only keeps primary tabs warm", () => {
  const primaryTabs = ["home", "messages", "progress", "fees"];
  let visitedTabs = ["home"];

  visitedTabs = rememberRoleTab(visitedTabs, "messages", primaryTabs);
  visitedTabs = rememberRoleTab(visitedTabs, "notifications", primaryTabs);

  assert.deepEqual(visitedTabs, ["home", "messages"]);
  assert.deepEqual(getMountedRoleTabs("notifications", visitedTabs, primaryTabs), ["home", "messages", "notifications"]);
  assert.deepEqual(getMountedRoleTabs("messages", visitedTabs, primaryTabs), ["home", "messages"]);
});

test("role shell tab mounting does not duplicate primary tabs after revisits", () => {
  const primaryTabs = ["overview", "rollcall", "people", "notifications"];
  let visitedTabs = ["overview"];

  visitedTabs = rememberRoleTab(visitedTabs, "rollcall", primaryTabs);
  visitedTabs = rememberRoleTab(visitedTabs, "people", primaryTabs);
  visitedTabs = rememberRoleTab(visitedTabs, "rollcall", primaryTabs);

  assert.deepEqual(visitedTabs, ["overview", "rollcall", "people"]);
  assert.deepEqual(getMountedRoleTabs("people", visitedTabs, primaryTabs), ["overview", "rollcall", "people"]);
});
