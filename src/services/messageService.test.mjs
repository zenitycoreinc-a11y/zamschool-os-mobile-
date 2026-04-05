import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "messageService.js"), "utf8");

test("message service reads inbox data through the account API", () => {
  assert.equal(source.includes("/api/account/messages"), true);
  assert.equal(source.includes("export async function listMyMessages"), true);
});
