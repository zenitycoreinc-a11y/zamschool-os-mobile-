import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const studentSource = readFileSync(projectPath("src", "screens", "student", "StudentMessagesScreen.js"), "utf8");
const teacherSource = readFileSync(projectPath("src", "screens", "teacher", "TeacherMessagesScreen.js"), "utf8");

test("student inbox uses the shared premium feed hero and feed card surfaces", () => {
  assert.equal(studentSource.includes("FeedHero"), true);
  assert.equal(studentSource.includes("FeedCard"), true);
  assert.equal(studentSource.includes("EmptyState"), true);
});

test("teacher inbox is upgraded from a plain card list to the shared inbox language", () => {
  assert.equal(teacherSource.includes("FeedHero"), true);
  assert.equal(teacherSource.includes("FeedCard"), true);
  assert.equal(teacherSource.includes("RefreshControl"), true);
});
