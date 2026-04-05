import test from "node:test";
import assert from "node:assert/strict";

import {
  canSelfRegisterRole,
  getSchoolCodeError,
  resolvePostLoginStep,
} from "./loginPolicy.js";

test("getSchoolCodeError allows login when no build-time school code is configured", () => {
  assert.equal(getSchoolCodeError("", ""), null);
  assert.equal(getSchoolCodeError("", null), null);
});

test("getSchoolCodeError validates the configured school code case-insensitively", () => {
  assert.equal(getSchoolCodeError("zam-001", "ZAM-001"), null);
  assert.equal(getSchoolCodeError("", "ZAM-001"), "School code is required");
  assert.equal(getSchoolCodeError("BAD", "ZAM-001"), "Invalid school code.");
});

test("canSelfRegisterRole blocks school-managed account roles", () => {
  assert.equal(canSelfRegisterRole("student"), false);
  assert.equal(canSelfRegisterRole("teacher"), false);
  assert.equal(canSelfRegisterRole("parent"), false);
  assert.equal(canSelfRegisterRole("admin"), false);
  assert.equal(canSelfRegisterRole("payments"), false);
  assert.equal(canSelfRegisterRole("unknown"), false);
});

test("resolvePostLoginStep forces password change for managed roles on first login", () => {
  assert.equal(
    resolvePostLoginStep({
      role: "teacher",
      mustChangePassword: true,
    }),
    "force-password-change"
  );
});

test("resolvePostLoginStep allows normal app access when password change is not required", () => {
  assert.equal(
    resolvePostLoginStep({
      role: "student",
      mustChangePassword: false,
    }),
    "continue"
  );
});
