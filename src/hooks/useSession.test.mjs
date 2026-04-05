import test from "node:test";
import assert from "node:assert/strict";

import { getSessionViewState } from "./useSession.js";

test("getSessionViewState keeps signed-in users in loading while profile is unresolved", () => {
  const state = getSessionViewState({
    session: { user: { id: "student-1" } },
    profile: null,
    loading: false,
    profileResolved: false,
  });

  assert.equal(state, "loading");
});

test("getSessionViewState returns missing-profile only after profile resolution completes", () => {
  const state = getSessionViewState({
    session: { user: { id: "student-1" } },
    profile: null,
    loading: false,
    profileResolved: true,
  });

  assert.equal(state, "missing-profile");
});

test("getSessionViewState returns profile-error for recoverable profile failures", () => {
  const state = getSessionViewState({
    session: { user: { id: "student-1" } },
    profile: null,
    loading: false,
    profileResolved: true,
    error: "Network request failed.",
  });

  assert.equal(state, "profile-error");
});

test("getSessionViewState returns signed-out when no session exists", () => {
  const state = getSessionViewState({
    session: null,
    profile: null,
    loading: false,
    profileResolved: true,
  });

  assert.equal(state, "signed-out");
});

test("getSessionViewState returns ready when session and profile are both present", () => {
  const state = getSessionViewState({
    session: { user: { id: "student-1" } },
    profile: { id: "student-1", role: "student" },
    loading: false,
    profileResolved: true,
  });

  assert.equal(state, "ready");
});
