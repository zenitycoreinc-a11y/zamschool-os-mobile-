import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../../test/project-paths.mjs";

const source = readFileSync(projectPath("src", "screens", "admin", "AdminPeopleScreen.js"), "utf8");

test("admin people screen opens a shared detail sheet for selected people", () => {
  assert.equal(source.includes("ContentDetailSheet"), true);
  assert.equal(source.includes("getAdminPersonDetail"), true);
  assert.equal(source.includes("handlePersonPress"), true);
  assert.equal(source.includes("visible={Boolean(selectedPersonDetail)}"), true);
});
