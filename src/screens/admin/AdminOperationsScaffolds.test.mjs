import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { projectPath } from "../../../test/project-paths.mjs";

const rollCallPath = projectPath("src", "screens", "admin", "AdminRollCallMonitorScreen.js");
const peoplePath = projectPath("src", "screens", "admin", "AdminPeopleScreen.js");

test("admin roll call monitor scaffold exists with class-first operational language", () => {
  assert.equal(existsSync(rollCallPath), true);
  const source = readFileSync(rollCallPath, "utf8");
  assert.equal(source.includes("Missing morning roll calls"), true);
  assert.equal(source.includes("Open class"), true);
});

test("admin people scaffold exists with students teachers parents directory tabs", () => {
  assert.equal(existsSync(peoplePath), true);
  const source = readFileSync(peoplePath, "utf8");
  assert.equal(source.includes("Students"), true);
  assert.equal(source.includes("Teachers"), true);
  assert.equal(source.includes("Parents"), true);
  assert.equal(source.includes("ContentDetailSheet"), true);
  assert.equal(source.includes("getAdminPersonDetail"), true);
});

test("admin roll call monitor uses distinct state accent tokens", () => {
  const source = readFileSync(rollCallPath, "utf8");
  assert.equal(source.includes("colors.dangerSoft"), true);
  assert.equal(source.includes("colors.successSoft"), true);
  assert.equal(source.includes("colors.warningSoft"), true);
});
