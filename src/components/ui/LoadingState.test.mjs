import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "LoadingState.js"), "utf8");

test("loading state no longer shows restore copy during mobile navigation", () => {
  assert.equal(source.includes("Starting where you left off..."), false);
  assert.equal(source.includes("<ActivityIndicator"), true);
  assert.equal(source.includes("Loading…"), true);
  assert.equal(source.includes("Preparing your dashboard"), false);
});
