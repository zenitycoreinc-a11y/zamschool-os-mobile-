import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "announcementService.js"), "utf8");

test("announcement service reads announcement feeds through the account API", () => {
  assert.equal(source.includes("/api/account/announcements"), true);
  assert.equal(source.includes("export async function listAnnouncements"), true);
});
