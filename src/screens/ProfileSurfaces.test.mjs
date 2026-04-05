import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const sharedProfilePath = projectPath("src", "components", "shared", "AccountProfileView.js");
const teacherProfilePath = projectPath("src", "screens", "teacher", "TeacherProfileScreen.js");
const parentShellPath = projectPath("src", "screens", "ParentShellScreen.js");
const adminShellPath = projectPath("src", "screens", "AdminShellScreen.js");

test("shared role profile surface exists with avatar upload and account actions", () => {
  assert.equal(existsSync(sharedProfilePath), true);
  const source = readFileSync(sharedProfilePath, "utf8");

  assert.equal(source.includes("AvatarCircle"), true);
  assert.equal(source.includes("uploadMyProfileAvatar"), true);
  assert.equal(source.includes("resetPasswordForEmail"), true);
  assert.equal(source.includes("Upload Photo"), true);
  assert.equal(source.includes("Notification permissions"), true);
  assert.equal(source.includes("requestNotificationPermission"), true);
  assert.equal(source.includes("openNotificationSettings"), true);
});

test("teacher, parent, and admin profiles use the shared role profile surface", () => {
  const teacherSource = readFileSync(teacherProfilePath, "utf8");
  const parentSource = readFileSync(parentShellPath, "utf8");
  const adminSource = readFileSync(adminShellPath, "utf8");

  assert.equal(teacherSource.includes("AccountProfileView"), true);
  assert.equal(parentSource.includes("AccountProfileView"), true);
  assert.equal(adminSource.includes("AccountProfileView"), true);
});
