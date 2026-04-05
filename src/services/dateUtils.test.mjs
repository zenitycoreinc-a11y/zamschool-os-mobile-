import test from "node:test";
import assert from "node:assert/strict";

import { formatLocalDateInputValue } from "./dateUtils.js";

test("formatLocalDateInputValue keeps the mobile rollcall date on the local calendar day", () => {
  const value = formatLocalDateInputValue(new Date(2026, 2, 19, 0, 30, 0));
  assert.equal(value, "2026-03-19");
});
