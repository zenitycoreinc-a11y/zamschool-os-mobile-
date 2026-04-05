import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_AUTH_RETRY_SECONDS,
  getAuthRateLimitInfo,
} from "./authRateLimit.js";

test("getAuthRateLimitInfo recognizes auth throttle responses", () => {
  const result = getAuthRateLimitInfo({
    message: "Too many requests. Please try again in 12 seconds.",
    status: 429,
  });

  assert.equal(result.isRateLimited, true);
  assert.equal(result.retryAfterSeconds, 12);
  assert.match(result.message, /12 seconds/i);
});

test("getAuthRateLimitInfo falls back to the default retry window", () => {
  const result = getAuthRateLimitInfo({
    message: "Too many requests. Please try again shortly.",
  });

  assert.equal(result.isRateLimited, true);
  assert.equal(result.retryAfterSeconds, DEFAULT_AUTH_RETRY_SECONDS);
});

test("getAuthRateLimitInfo ignores non-throttle auth failures", () => {
  const result = getAuthRateLimitInfo({
    message: "Invalid login credentials",
  });

  assert.equal(result.isRateLimited, false);
  assert.equal(result.retryAfterSeconds, 0);
});
