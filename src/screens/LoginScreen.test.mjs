import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "LoginScreen.js"), "utf8");

test("login screen no longer uses the overlapped web card layout", () => {
  assert.equal(source.includes("marginTop: -18"), false);
  assert.equal(source.includes("contentContainerStyle={styles.content}"), true);
  assert.equal(source.includes("style={styles.loginPanel}"), true);
});

test("login screen does not enforce signup password length rules during sign-in", () => {
  assert.equal(source.includes("Password must be at least 8 characters"), false);
  assert.equal(source.includes("Use at least 8 characters."), false);
});

test("login screen includes managed auth throttle cooldown handling", () => {
  assert.equal(source.includes("getAuthRateLimitInfo"), true);
  assert.equal(source.includes("Too many login attempts. Try again in"), true);
  assert.equal(source.includes("disabled={isLoading || cooldownActive}"), true);
});
