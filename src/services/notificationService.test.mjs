import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "notificationService.js"), "utf8");

test("notification service exposes grouping and mark-read helpers for mobile bell flows", () => {
  assert.equal(source.includes("export function groupNotificationsForBell"), true);
  assert.equal(source.includes("export async function markMyNotificationRead"), true);
});

test("notification service exposes a compact unread summary reader for shell badges", () => {
  assert.equal(source.includes("export async function getMyUnreadSummary"), true);
  assert.equal(source.includes("/api/account/unread-summary"), true);
});

test("notification service reads notification feeds through the account API", () => {
  assert.equal(source.includes("/api/account/notifications"), true);
});

test("notification service keeps notification updates scoped to the signed-in user", () => {
  assert.equal(source.includes("eq('user_id', user.id)"), true);
  assert.equal(source.includes("eq('recipient_id', user.id)"), true);
  assert.equal(source.includes("() => client.from('notifications').update({ is_read: true }).eq('id', notificationId),"), false);
});
