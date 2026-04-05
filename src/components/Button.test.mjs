import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

const source = readFileSync(projectPath("src", "components", "Button.js"), "utf8");

test("secondary buttons use a readable text color on light surfaces", () => {
  assert.equal(source.includes("variant === 'secondary' ? styles.secondaryText : styles.primaryText"), true);
  assert.equal(source.includes("secondaryText"), true);
  assert.equal(source.includes("color: colors.text"), true);
});
