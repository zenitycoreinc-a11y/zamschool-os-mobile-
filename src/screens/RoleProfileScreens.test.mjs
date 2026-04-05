import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const teacherProfileSource = readFileSync(
  projectPath("src", "screens", "teacher", "TeacherProfileScreen.js"),
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
const studentProfileSource = readFileSync(
  projectPath("src", "screens", "student", "StudentProfileScreen.js"),
  "utf8"
);

test("teacher profile supports premium account actions instead of a plain text card", () => {
  assert.equal(
    teacherProfileSource.includes("AccountProfileView") ||
      teacherProfileSource.includes("RoleProfileScreen"),
    true
  );
  assert.equal(teacherProfileSource.includes("Change Password"), true);
  assert.equal(teacherProfileSource.includes("Upload Photo"), true);
});

test("parent shell includes a richer account profile surface", () => {
  assert.equal(parentShellSource.includes("AccountProfileView"), true);
  assert.equal(parentShellSource.includes("Upload Photo"), true);
  assert.equal(parentShellSource.includes("Change Password"), true);
});

test("admin shell includes a richer account profile surface", () => {
  assert.equal(adminShellSource.includes("AccountProfileView"), true);
  assert.equal(adminShellSource.includes("Upload Photo"), true);
  assert.equal(adminShellSource.includes("Change Password"), true);
});

test("student profile exposes notification permission controls alongside account actions", () => {
  assert.equal(studentProfileSource.includes("Notification permissions"), true);
  assert.equal(studentProfileSource.includes("requestNotificationPermission"), true);
  assert.equal(studentProfileSource.includes("openNotificationSettings"), true);
});
