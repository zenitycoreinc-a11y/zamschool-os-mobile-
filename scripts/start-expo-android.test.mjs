import test from "node:test";
import assert from "node:assert/strict";

import { extractReversePorts } from "./start-expo-android.mjs";

test("extractReversePorts returns loopback api ports from mobile env", () => {
  assert.deepEqual(
    extractReversePorts({
      EXPO_PUBLIC_WEBAPP_ORIGIN: "http://localhost:3000",
    }),
    [3000]
  );
});

test("extractReversePorts deduplicates multiple localhost origins", () => {
  assert.deepEqual(
    extractReversePorts({
      EXPO_PUBLIC_WEBAPP_ORIGIN: "http://127.0.0.1:3000, http://localhost:3000",
      EXPO_PUBLIC_API_ORIGIN: "http://0.0.0.0:3000",
    }),
    [3000]
  );
});

test("extractReversePorts ignores public hosts and invalid values", () => {
  assert.deepEqual(
    extractReversePorts({
      EXPO_PUBLIC_WEBAPP_ORIGIN: "https://zam.example.com",
      EXPO_PUBLIC_API_ORIGIN: "not-a-url",
    }),
    []
  );
});
