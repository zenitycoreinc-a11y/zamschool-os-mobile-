import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const premiumShellSource = readFileSync(path.join(dirname, "PremiumShell.js"), "utf8");
const premiumHeaderSource = readFileSync(path.join(dirname, "PremiumHeader.js"), "utf8");
const roleTabBarSource = readFileSync(path.join(dirname, "RoleTabBar.js"), "utf8");

test("premium shell exposes a visible dashboard theme toggle", () => {
  assert.equal(premiumShellSource.includes("Switch dashboard theme"), true);
  assert.equal(premiumShellSource.includes("Midnight"), true);
  assert.equal(premiumShellSource.includes("Light"), true);
});

test("dashboard chrome consumes the active dashboard theme tokens", () => {
  assert.equal(premiumShellSource.includes("theme.chromeGradient"), true);
  assert.equal(premiumHeaderSource.includes("theme.colors"), true);
  assert.equal(roleTabBarSource.includes("theme.colors"), true);
});
