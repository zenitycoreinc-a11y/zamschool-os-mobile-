import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "StudentShellScreen.js"), "utf8");

test("student home uses the lighter dashboard structure instead of the old quick-access section card", () => {
  assert.equal(source.includes('SectionCard title="Quick access"'), false);
  assert.equal(source.includes("styles.quickActionDock"), true);
  assert.equal(source.includes("styles.heroFocusCard"), true);
});
