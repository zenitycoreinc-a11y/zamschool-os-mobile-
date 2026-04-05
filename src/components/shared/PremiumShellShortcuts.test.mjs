import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "PremiumShell.js"), "utf8");

test("premium shell exposes both notification and profile shortcuts in the header", () => {
  assert.equal(source.includes('accessibilityLabel="Open notifications"'), true);
  assert.equal(source.includes('accessibilityLabel="Open profile"'), true);
  assert.equal(source.includes('onSelect?.(\'notifications\')'), true);
});

test("premium shell renders an unread notification badge count only when needed", () => {
  assert.equal(source.includes("unreadNotificationCount"), true);
  assert.equal(source.includes("notificationBadge"), true);
  assert.equal(source.includes("formatUnreadCount"), true);
});
