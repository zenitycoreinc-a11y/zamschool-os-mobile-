import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "..", "App.js"), "utf8");

test("app loading surfaces no longer mention restoring sessions or premium shell copy", () => {
  assert.equal(source.includes("Restoring session"), false);
  assert.equal(source.includes("Picking up your school workspace with the same premium shell."), false);
});
