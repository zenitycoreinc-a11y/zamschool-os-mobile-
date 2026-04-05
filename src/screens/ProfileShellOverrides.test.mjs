import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const teacherShellSource = readFileSync(
  projectPath("src", "screens", "TeacherShellScreen.js"),
  "utf8"
);
const parentShellSource = readFileSync(
  projectPath("src", "screens", "ParentShellScreen.js"),
  "utf8"
);
const adminShellSource = readFileSync(
  projectPath("src", "screens", "AdminShellScreen.js"),
  "utf8"
);

function assertResetsOnProfileChange(source, label) {
  assert.equal(source.includes("useEffect(() => {"), true, `${label} should reset overrides in an effect`);
  assert.equal(source.includes("setProfileOverrides({});"), true, `${label} should clear local overrides`);
  assert.equal(source.includes("profile?.avatarUrl"), true, `${label} should react to avatar refreshes`);
  assert.equal(source.includes("profile?.email"), true, `${label} should react to identity changes`);
}

test("teacher, parent, and admin shells clear temporary profile overrides when upstream profile changes", () => {
  assertResetsOnProfileChange(teacherShellSource, "Teacher shell");
  assertResetsOnProfileChange(parentShellSource, "Parent shell");
  assertResetsOnProfileChange(adminShellSource, "Admin shell");
});
