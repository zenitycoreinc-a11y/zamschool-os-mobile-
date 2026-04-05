import test from "node:test";
import assert from "node:assert/strict";
import {
  CACHED_STUDENT_TABS,
  getMountedStudentTabs,
  rememberStudentTab,
} from "./student/studentTabMounting.js";

test("student shell keeps fallback dashboard content interactive during restore", () => {
  assert.deepEqual(CACHED_STUDENT_TABS, ["home", "attendance", "results", "messages"]);
});

test("student shell only keeps primary tabs warm and remounts secondary routes on demand", () => {
  let visitedTabs = ["home"];

  visitedTabs = rememberStudentTab(visitedTabs, "attendance");
  visitedTabs = rememberStudentTab(visitedTabs, "profile");
  visitedTabs = rememberStudentTab(visitedTabs, "messages");

  assert.deepEqual(visitedTabs, ["home", "attendance", "messages"]);
  assert.deepEqual(getMountedStudentTabs("profile", visitedTabs), ["home", "attendance", "messages", "profile"]);
  assert.deepEqual(getMountedStudentTabs("messages", visitedTabs), ["home", "attendance", "messages"]);
});

test("student shell does not duplicate warm tabs when revisiting them", () => {
  let visitedTabs = ["home"];

  visitedTabs = rememberStudentTab(visitedTabs, "attendance");
  visitedTabs = rememberStudentTab(visitedTabs, "results");
  visitedTabs = rememberStudentTab(visitedTabs, "attendance");
  visitedTabs = rememberStudentTab(visitedTabs, "notifications");

  assert.deepEqual(visitedTabs, ["home", "attendance", "results"]);
  assert.deepEqual(getMountedStudentTabs("results", visitedTabs), ["home", "attendance", "results"]);
});
