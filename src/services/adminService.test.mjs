import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminOverviewFallback,
  getAdminOverviewCounts,
  getAdminUsersDirectory,
  normalizeAdminProfilesFromDirectory,
} from "./adminService.js";

function createCountQuery(result) {
  return {
    select() {
      return Promise.resolve(result);
    },
  };
}

test("normalizeAdminProfilesFromDirectory flattens relationship data into one admin user directory", () => {
  const rows = normalizeAdminProfilesFromDirectory({
    students: [
      { profileId: "student-1", displayName: "Student One", email: "student1@gmail.com" },
    ],
    teachers: [
      { profileId: "teacher-1", displayName: "Teacher One", email: "teacher1@gmail.com" },
    ],
    parents: [
      { profileId: "parent-1", displayName: "Parent One", email: "parent1@gmail.com" },
    ],
  });

  assert.deepEqual(
    rows.map((row) => ({ id: row.id, role: row.role, email: row.email })),
    [
      { id: "parent-1", role: "parent", email: "parent1@gmail.com" },
      { id: "student-1", role: "student", email: "student1@gmail.com" },
      { id: "teacher-1", role: "teacher", email: "teacher1@gmail.com" },
    ],
  );
});

test("getAdminOverviewCounts falls back to relationship directory counts when direct admin queries fail", async () => {
  const client = {
    from() {
      return createCountQuery({ count: null, error: new Error("permission denied") });
    },
  };

  const counts = await getAdminOverviewCounts({
    clientOverride: client,
    requestFn: async (path) => {
      assert.equal(path, "/api/admin/relationships");
      return {
        data: {
          students: [{ profileId: "student-1" }, { profileId: "student-2" }],
          teachers: [{ profileId: "teacher-1" }],
          parents: [{ profileId: "parent-1" }],
          classes: [{ id: "class-1" }, { id: "class-2" }],
        },
      };
    },
  });

  assert.deepEqual(counts, {
    profiles: 4,
    students: 2,
    teachers: 1,
    announcements: 0,
    classes: 2,
    notice: "Direct admin counts unavailable. Showing a safe mobile fallback.",
  });
});

test("getAdminUsersDirectory returns a safe empty directory when both direct and api loading fail", async () => {
  const directory = await getAdminUsersDirectory(100, {
    clientOverride: {
      from() {
        return {
          select() {
            return {
              order() {
                return {
                  limit() {
                    return Promise.resolve({ data: null, error: new Error("broken") });
                  },
                };
              },
            };
          },
        };
      },
    },
    requestFn: async () => {
      throw new Error("Network request failed");
    },
  });

  assert.deepEqual(directory.rows, []);
  assert.equal(directory.notice, "Admin user data is temporarily unavailable on mobile.");
});

test("buildAdminOverviewFallback keeps the admin shell usable with a readable notice", () => {
  assert.deepEqual(buildAdminOverviewFallback("Network request failed"), {
    profiles: 0,
    students: 0,
    teachers: 0,
    announcements: 0,
    classes: 0,
    notice: "Network request failed",
  });
});
