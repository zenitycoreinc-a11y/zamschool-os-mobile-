import test from "node:test";
import assert from "node:assert/strict";

import {
  colors,
  dashboardThemeModes,
  dashboardThemes,
  getDashboardTheme,
  getRolePalette,
  motion,
  radii,
  roleThemes,
  shadows,
} from "./theme.js";

test("theme exposes layered premium surface tokens", () => {
  assert.equal(typeof colors.bg, "string");
  assert.equal(typeof colors.surface, "string");
  assert.equal(typeof colors.surfaceRaised, "string");
  assert.equal(typeof colors.card, "string");
});

test("theme exposes shared motion, shadow, and radius scales", () => {
  assert.equal(typeof motion.fast, "number");
  assert.equal(typeof motion.normal, "number");
  assert.equal(typeof radii.lg, "number");
  assert.equal(typeof shadows.card.shadowOpacity, "number");
});

test("shared spring preset uses exactly one compatible animation family", () => {
  const spring = motion.spring;
  const families = [
    ["speed", "bounciness"],
    ["tension", "friction"],
    ["stiffness", "damping", "mass"],
  ];

  const activeFamilies = families.filter((keys) => keys.some((key) => key in spring));

  assert.equal(activeFamilies.length, 1);
});

test("theme exposes role palettes and falls back safely", () => {
  assert.equal(roleThemes.student.accent, getRolePalette("student").accent);
  assert.equal(roleThemes.parent.accent, getRolePalette("parent").accent);
  assert.equal(roleThemes.teacher.accent, getRolePalette("teacher").accent);
  assert.equal(roleThemes.admin.accent, getRolePalette("admin").accent);
  assert.equal(getRolePalette("unknown").accent, roleThemes.student.accent);
});

test("dashboard themes expose midnight and light modes with a safe fallback", () => {
  assert.deepEqual(dashboardThemeModes, ["midnight", "light"]);
  assert.equal(typeof dashboardThemes.midnight.colors.bg, "string");
  assert.equal(typeof dashboardThemes.light.colors.bg, "string");
  assert.equal(getDashboardTheme("midnight").mode, "midnight");
  assert.equal(getDashboardTheme("light").mode, "light");
  assert.equal(getDashboardTheme("unexpected").mode, "midnight");
});
