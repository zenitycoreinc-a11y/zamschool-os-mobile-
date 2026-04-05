import test from "node:test";
import assert from "node:assert/strict";

import {
  DASHBOARD_THEME_STORAGE_KEY,
  createDashboardThemePreference,
  normalizeDashboardThemeMode,
} from "./dashboardTheme.js";

test("dashboard theme mode normalization defaults safely to midnight", () => {
  assert.equal(normalizeDashboardThemeMode("midnight"), "midnight");
  assert.equal(normalizeDashboardThemeMode("light"), "light");
  assert.equal(normalizeDashboardThemeMode(""), "midnight");
  assert.equal(normalizeDashboardThemeMode("other"), "midnight");
});

test("dashboard theme preference loads from storage and falls back safely", async () => {
  const storage = {
    async getItem(key) {
      assert.equal(key, DASHBOARD_THEME_STORAGE_KEY);
      return "light";
    },
    async setItem() {
      throw new Error("setItem should not be called when loading");
    },
  };

  const preference = createDashboardThemePreference(storage);
  assert.equal(await preference.load(), "light");

  const badStorage = {
    async getItem() {
      return "unexpected";
    },
    async setItem() {},
  };

  assert.equal(await createDashboardThemePreference(badStorage).load(), "midnight");
});

test("dashboard theme preference saves normalized values under the dedicated key", async () => {
  const writes = [];
  const storage = {
    async getItem() {
      return null;
    },
    async setItem(key, value) {
      writes.push([key, value]);
    },
  };

  const preference = createDashboardThemePreference(storage);
  await preference.save("light");
  await preference.save("unknown");

  assert.deepEqual(writes, [
    [DASHBOARD_THEME_STORAGE_KEY, "light"],
    [DASHBOARD_THEME_STORAGE_KEY, "midnight"],
  ]);
});
