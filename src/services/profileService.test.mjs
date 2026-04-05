import test from "node:test";
import assert from "node:assert/strict";

import { normalizeKnownRole } from "./roleNormalization.js";
import {
  buildFallbackProfile,
  buildDetailedFallbackProfile,
  buildProfileFromRow,
  getMyProfile,
  getMyProfileWithDetails,
} from "./profileService.js";
test("normalizeKnownRole accepts uppercase database roles", () => {
  assert.equal(normalizeKnownRole("STUDENT"), "student");
  assert.equal(normalizeKnownRole("PARENT"), "parent");
});

test("normalizeKnownRole rejects unknown roles", () => {
  assert.equal(normalizeKnownRole("PREFECT"), "unknown");
  assert.equal(normalizeKnownRole(null), "unknown");
});

test("buildProfileFromRow maps must_change_password to mustChangePassword", () => {
  const profile = buildProfileFromRow(
    {
      id: "student-1",
      first_name: "Mary",
      last_name: "Banda",
      role: "student",
      school_id: "school-1",
      email: "mary@example.com",
      phone: "+260900000001",
      status: "ACTIVE",
      must_change_password: true,
    },
    "mary@example.com"
  );

  assert.equal(profile.mustChangePassword, true);
  assert.equal(profile.profileMissing, false);
  assert.equal(profile.phone, "+260900000001");
  assert.equal(profile.status, "ACTIVE");
  assert.equal(profile.roleLabel, "Student");
  assert.equal(profile.statusLabel, "Active");
});

test("buildFallbackProfile keeps mustChangePassword false", () => {
  const profile = buildFallbackProfile(
    {
      id: "student-1",
      email: "mary@example.com",
      user_metadata: { first_name: "Mary", last_name: "Banda" },
    },
    null
  );

  assert.equal(profile.mustChangePassword, false);
  assert.equal(profile.profileMissing, true);
  assert.equal(profile.phone, null);
  assert.equal(profile.status, null);
  assert.equal(profile.roleLabel, "Unknown");
  assert.equal(profile.statusLabel, "Status pending");
});

test("buildFallbackProfile preserves mustChangePassword from auth metadata", () => {
  const profile = buildFallbackProfile(
    {
      id: "teacher-1",
      email: "teacher@example.com",
      user_metadata: {
        first_name: "Teach",
        last_name: "Er",
        must_change_password: true,
      },
    },
    null
  );

  assert.equal(profile.mustChangePassword, true);
  assert.equal(profile.profileMissing, true);
});

test("getMyProfileWithDetails returns a safe fallback when profile reads fail", async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "student-1",
            email: "mary@example.com",
            user_metadata: { first_name: "Mary", last_name: "Banda" },
          },
        },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: new Error("column must_change_password does not exist or RLS blocked the read"),
          }),
        }),
      }),
    }),
  };

  const profile = await getMyProfileWithDetails(fakeClient);

  assert.equal(profile.mustChangePassword, false);
  assert.equal(profile.profileMissing, true);
  assert.equal(profile.classId, null);
  assert.equal(profile.gradeLevel, null);
  assert.deepEqual(
    buildDetailedFallbackProfile(
      {
        id: "student-1",
        email: "mary@example.com",
        user_metadata: { first_name: "Mary", last_name: "Banda" },
      },
      null
    ),
    profile
  );
});

test("getMyProfile fails closed when the shared profile row is missing", async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "teacher-1",
            email: "teacher@example.com",
            user_metadata: { first_name: "Teach", last_name: "Er", role: "teacher" },
          },
        },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: null,
          }),
        }),
      }),
    }),
  };

  await assert.rejects(
    getMyProfile(fakeClient),
    (error) =>
      error instanceof Error &&
      error.message === "Your account is missing a shared profile. Contact your school administrator."
  );
});

test("getMyProfile fails closed when profile reads are blocked", async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "parent-1",
            email: "parent@example.com",
            user_metadata: { first_name: "Par", last_name: "Ent", role: "parent" },
          },
        },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: new Error("RLS blocked profile read"),
          }),
        }),
      }),
    }),
  };

  await assert.rejects(
    getMyProfile(fakeClient),
    (error) =>
      error instanceof Error &&
      error.message === "Your account is missing a shared profile. Contact your school administrator."
  );
});

test("getMyProfile tolerates missing optional profile columns when a narrower select succeeds", async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "parent-1",
            email: "demo.parent1@gmail.com",
            user_metadata: { first_name: "Demo", last_name: "Parent", role: "parent" },
          },
        },
        error: null,
      }),
    },
    from: () => ({
      select: (query) => ({
        eq: () => ({
          maybeSingle: async () => {
            if (query.includes("status")) {
              return {
                data: null,
                error: { code: "42703", message: "column profiles.status does not exist" },
              };
            }

            if (query.includes("avatar_url")) {
              return {
                data: null,
                error: { code: "42703", message: "column profiles.avatar_url does not exist" },
              };
            }

            if (query.includes("photo_url")) {
              return {
                data: { id: "parent-1", photo_url: "https://example.com/photo.jpg" },
                error: null,
              };
            }

            return {
              data: {
                id: "parent-1",
                first_name: "Demo",
                last_name: "Parent",
                role: "parent",
                school_id: "school-1",
                email: "demo.parent1@gmail.com",
                phone: "+260900000011",
              },
              error: null,
            };
          },
        }),
      }),
    }),
  };

  const profile = await getMyProfile(fakeClient);

  assert.equal(profile.fullName, "Demo Parent");
  assert.equal(profile.role, "parent");
  assert.equal(profile.phone, "+260900000011");
  assert.equal(profile.status, null);
  assert.equal(profile.avatarUrl, "https://example.com/photo.jpg");
});
