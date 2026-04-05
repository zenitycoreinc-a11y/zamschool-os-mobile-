import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "PremiumSidebar.js"), "utf8");

test("premium sidebar is explicitly anchored to the left edge", () => {
  assert.equal(source.includes("position: 'absolute'"), true);
  assert.equal(source.includes("left: 0"), true);
  assert.equal(source.includes("justifyContent: 'flex-start'"), true);
});

test("premium sidebar uses a scrollable body with a separate footer so content does not clip at the safe areas", () => {
  assert.equal(source.includes("<ScrollView"), true);
  assert.equal(source.includes("style={styles.scroll}"), true);
  assert.equal(source.includes("<View style={styles.footer}>"), true);
  assert.equal(source.includes("paddingTop: Math.max(insets.top + spacing.sm, spacing.xl)"), true);
  assert.equal(source.includes("paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg)"), true);
});
