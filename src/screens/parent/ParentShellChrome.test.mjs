import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const attendanceSource = readFileSync(path.join(dirname, "ParentAttendanceScreen.js"), "utf8");
const notificationsSource = readFileSync(path.join(dirname, "ParentNotificationsScreen.js"), "utf8");
const messagesSource = readFileSync(path.join(dirname, "..", "ParentMessagesScreen.js"), "utf8");

test("parent attendance screen can render inside the shared shell without its own top card chrome", () => {
  assert.equal(attendanceSource.includes("embedded = false"), true);
  assert.equal(attendanceSource.includes("embedded ? null :"), true);
});

test("parent notifications screen can render inside the shared shell without its own back-header block", () => {
  assert.equal(notificationsSource.includes("embedded = false"), true);
  assert.equal(notificationsSource.includes("embedded ? null :"), true);
});

test("parent messages screen uses the shared shell embedding contract instead of a legacy showHeader toggle", () => {
  assert.equal(messagesSource.includes("showHeader = true"), false);
  assert.equal(messagesSource.includes("embedded = false"), true);
  assert.equal(messagesSource.includes("embedded ? null :"), true);
});
