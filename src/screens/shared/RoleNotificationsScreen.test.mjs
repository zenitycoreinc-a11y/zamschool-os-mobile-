import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "RoleNotificationsScreen.js"), "utf8");

test("role notifications use the shared detail sheet for readable bell items", () => {
  assert.equal(source.includes("import { ContentDetailSheet }"), true);
  assert.equal(source.includes("<ContentDetailSheet"), true);
  assert.equal(source.includes("markMyNotificationRead"), true);
  assert.equal(source.includes("unread={!item.is_read}"), true);
  assert.equal(source.includes("selectedNotification"), true);
});

test("role notifications group items into school, teacher, and app sections", () => {
  assert.equal(source.includes("School"), true);
  assert.equal(source.includes("Teacher"), true);
  assert.equal(source.includes("App"), true);
});
