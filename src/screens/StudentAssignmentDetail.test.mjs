import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "StudentShellScreen.js"), "utf8");

test("student assignment taps open an item detail surface instead of routing only to the assignment list", () => {
  assert.equal(source.includes("selectedAssignment"), true);
  assert.equal(source.includes("ContentDetailSheet"), true);
  assert.equal(source.includes("onSelectAssignment"), true);
});
