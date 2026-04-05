import test from "node:test";
import assert from "node:assert/strict";

import {
  completeFirstLoginPasswordChange,
  getAuthRateLimitInfo,
  normalizeAuthError,
  SELF_SIGN_UP_DISABLED_MESSAGE,
  signUpWithRole,
  verifyCurrentPassword,
} from "./authService.js";
import { resolvePostLoginStep } from "./loginPolicy.js";

test("completeFirstLoginPasswordChange verifies the current password, updates the user password, and then clears first-login flags", async () => {
  const calls = [];
  const fakeVerifyCurrentPassword = async (password) => {
    calls.push(["verifyCurrentPassword", password]);
  };
  const fakeUpdatePassword = async (password) => {
    calls.push(["updatePassword", password]);
  };
  const fakeRequest = async (path, options) => {
    calls.push(["request", path, options]);
    return { success: true };
  };

  const result = await completeFirstLoginPasswordChange(
    "TempPass123!",
    "NewPass123!",
    fakeRequest,
    {
      verifyCurrentPasswordFn: fakeVerifyCurrentPassword,
      updatePasswordFn: fakeUpdatePassword,
    }
  );

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls, [
    ["verifyCurrentPassword", "TempPass123!"],
    ["updatePassword", "NewPass123!"],
    [
      "request",
      "/api/auth/complete-first-login",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ],
  ]);
});

test("verifyCurrentPassword checks the active user's email with a throwaway auth client", async () => {
  const activeClientCalls = [];
  const verifierCalls = [];
  const createClientCalls = [];
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const activeClient = {
    auth: {
      async getUser() {
        activeClientCalls.push("getUser");
        return {
          data: {
            user: {
              email: "teacher@example.com",
            },
          },
          error: null,
        };
      },
    },
  };
  const fakeVerifier = {
    auth: {
      async signInWithPassword(payload) {
        verifierCalls.push(payload);
        return { error: null };
      },
    },
  };

  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

  try {
    await verifyCurrentPassword("TempPass123!", activeClient, (...args) => {
      createClientCalls.push(args);
      return fakeVerifier;
    });
  } finally {
    if (previousUrl === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousAnonKey === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
    }
  }

  assert.deepEqual(activeClientCalls, ["getUser"]);
  assert.equal(createClientCalls.length, 1);
  assert.equal(createClientCalls[0][0], "https://example.supabase.co");
  assert.equal(createClientCalls[0][1], "anon-key");
  assert.equal(createClientCalls[0][2]?.auth?.storageKey, "password-verification");
  assert.deepEqual(verifierCalls, [
    {
      email: "teacher@example.com",
      password: "TempPass123!",
    },
  ]);
});

test("signUpWithRole rejects all mobile self-sign-up attempts before reaching Supabase", async () => {
  let touchedSupabase = false;

  await assert.rejects(
    signUpWithRole(
      {
        email: "teacher@example.com",
        password: "TempPass123!",
        fullName: "Teacher User",
        role: "teacher",
      },
      async () => {
        touchedSupabase = true;
        throw new Error("should not be called");
      }
    ),
    (error) => error instanceof Error && error.message === SELF_SIGN_UP_DISABLED_MESSAGE
  );

  assert.equal(touchedSupabase, false);
});

test("signUpWithRole does not auto-sign-in when signup returns no session", async () => {
  let signInCalls = 0;
  let upsertPayload = null;
  const fakeClient = {
    auth: {
      async signUp() {
        return {
          data: {
            session: null,
            user: { id: "user-1" },
          },
          error: null,
        };
      },
      async signInWithPassword() {
        signInCalls += 1;
        return { data: {}, error: null };
      },
    },
    from(table) {
      assert.equal(table, "profiles");
      return {
        upsert(payload) {
          upsertPayload = payload;
          return { error: null };
        },
      };
    },
  };

  const result = await signUpWithRole(
    {
      email: "student@example.com",
      password: "TempPass123!",
      fullName: "Student User",
      role: "student",
    },
    async () => fakeClient,
    { canSelfRegisterRoleFn: () => true }
  );

  assert.equal(signInCalls, 0);
  assert.equal(result.user?.id, "user-1");
  assert.deepEqual(upsertPayload, {
    id: "user-1",
    first_name: "Student",
    last_name: "User",
    email: "student@example.com",
    role: "student",
  });
});

test("resolvePostLoginStep sends temporary-password accounts to forced password change", () => {
  assert.equal(
    resolvePostLoginStep({ role: "teacher", mustChangePassword: true }),
    "force-password-change"
  );
  assert.equal(resolvePostLoginStep({ role: "teacher", mustChangePassword: false }), "continue");
});

test("normalizeAuthError turns provider throttles into retry guidance", () => {
  const error = {
    message: "Too many requests. Please try again in 18 seconds.",
    status: 429,
  };

  assert.equal(getAuthRateLimitInfo(error).retryAfterSeconds, 18);
  assert.match(normalizeAuthError(error), /18 seconds/i);
});
