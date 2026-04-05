import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "App.js"), "utf8");

test("app role shell mapping includes every supported mobile school role", () => {
  assert.equal(source.includes("admin: AdminShellScreen"), true);
  assert.equal(source.includes("teacher: TeacherShellScreen"), true);
  assert.equal(source.includes("student: StudentShellScreen"), true);
  assert.equal(source.includes("parent: ParentShellScreen"), true);
  assert.equal(source.includes("payments: PaymentsShellScreen"), true);
});
