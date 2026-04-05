import test from "node:test";
import assert from "node:assert/strict";

import { studentBottomTabs, studentDrawerItems } from "./navigationConfig.js";

test("student bottom tabs use inbox instead of profile", () => {
  assert.deepEqual(
    studentBottomTabs.map((item) => item.key),
    ["home", "attendance", "results", "messages"],
  );
});

test("student drawer exposes both inbox and notifications separately alongside profile", () => {
  assert.equal(studentDrawerItems.some((item) => item.key === "profile"), true);
  assert.equal(studentDrawerItems.some((item) => item.key === "messages"), true);
  assert.equal(studentDrawerItems.some((item) => item.key === "notifications"), true);
});
