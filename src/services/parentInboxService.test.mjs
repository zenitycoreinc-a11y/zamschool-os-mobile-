import test from "node:test";
import assert from "node:assert/strict";

import {
  getUnreadParentNotificationIds,
  listParentInboxItems,
  markAllParentNotificationsRead,
  markParentNotificationRead,
  normalizeParentInboxItems,
} from "./parentInboxService.js";

test("normalizeParentInboxItems combines sources and maps attendance notifications to attendance navigation", () => {
  const items = normalizeParentInboxItems({
    notifications: [
      {
        id: "notif-1",
        title: "Mary Banda attendance for Mathematics (Grade 7A) on 2026-03-20 at 08:00",
        message: "Mary Banda was marked ABSENT for Mathematics (Grade 7A) on 2026-03-20 at 08:00 by Mr Banda.",
        type: "attendance",
        is_read: false,
        created_at: "2026-03-20T09:00:00.000Z",
      },
    ],
    announcements: [
      {
        id: "ann-1",
        title: "School notice",
        content: "PTA meeting on Friday.",
        created_at: "2026-03-20T08:00:00.000Z",
      },
    ],
    events: [
      {
        id: "event-1",
        title: "Sports Day",
        description: "All students attend in sports kit.",
        start_date: "2026-03-19T07:00:00.000Z",
        created_at: "2026-03-19T07:00:00.000Z",
      },
    ],
    children: [
      {
        id: "student-1",
        displayName: "Mary Banda",
        admissionNumber: "ADM-1",
      },
    ],
  });

  assert.equal(items.length, 3);
  assert.equal(items[0].id, "notif-1");
  assert.equal(items[0].source, "notification");
  assert.equal(items[0].type, "attendance");
  assert.equal(items[0].status, "unread");
  assert.deepEqual(items[0].navigation, {
    route: "attendance",
    studentId: "student-1",
  });

  assert.equal(items[1].source, "announcement");
  assert.equal(items[1].status, "read");
  assert.equal(items[1].navigation.route, null);

  assert.equal(items[2].source, "event");
  assert.equal(items[2].status, "read");
});

test("getUnreadParentNotificationIds only returns unread direct notification ids", () => {
  const ids = getUnreadParentNotificationIds([
    { id: "notif-1", source: "notification", status: "unread" },
    { id: "notif-2", source: "notification", status: "read" },
    { id: "ann-1", source: "announcement", status: "read" },
    { id: "event-1", source: "event", status: "read" },
  ]);

  assert.deepEqual(ids, ["notif-1"]);
});

test("listParentInboxItems reads parent children from the shared backend contract", async () => {
  const requestCalls = [];
  const fakeRequest = async (path) => {
    requestCalls.push(path);
    if (path === "/api/parent/children") {
      return {
        data: [
          {
            id: "student-1",
            displayName: "Mary Banda",
            admissionNumber: "ADM-1",
          },
        ],
      };
    }
    throw new Error(`Unexpected request path: ${path}`);
  };

  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "parent-user-1", email: "parent@example.com" } },
        error: null,
      }),
    },
    from(table) {
      if (table === "profiles") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: "parent-user-1",
                      first_name: "Parent",
                      last_name: "User",
                      role: "parent",
                      school_id: "school-1",
                      email: "parent@example.com",
                      must_change_password: false,
                      admission_number: null,
                      class_id: null,
                      grade_id: null,
                      classes: null,
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      return {
        select() {
          const query = {
            eq() {
              return query;
            },
            order() {
              return {
                limit: async () => {
                  if (table === "notifications") {
                    return {
                      data: [
                        {
                          id: "notif-1",
                          title: "Mary Banda attendance for Mathematics (Grade 7A) on 2026-03-20",
                          message: "Mary Banda was marked LATE for Mathematics.",
                          type: "attendance",
                          is_read: false,
                          created_at: "2026-03-20T09:00:00.000Z",
                        },
                      ],
                      error: null,
                    };
                  }
                  if (table === "announcements") {
                    return {
                      data: [
                        {
                          id: "ann-1",
                          title: "Notice",
                          content: "Parents meeting.",
                          created_at: "2026-03-20T08:00:00.000Z",
                        },
                      ],
                      error: null,
                    };
                  }
                  if (table === "events") {
                    return {
                      data: [
                        {
                          id: "event-1",
                          title: "Sports Day",
                          description: "Bring water.",
                          start_date: "2026-03-21T07:00:00.000Z",
                          created_at: "2026-03-19T07:00:00.000Z",
                        },
                      ],
                      error: null,
                    };
                  }
                  return { data: [], error: null };
                },
              };
            },
          };

          return query;
        },
      };
    },
  };

  const items = await listParentInboxItems({
    requestFn: fakeRequest,
    client: fakeClient,
  });

  assert.deepEqual(requestCalls, ["/api/parent/children"]);
  assert.equal(items.length, 3);
  const attendanceItem = items.find((item) => item.source === "notification");
  assert.equal(attendanceItem?.navigation.studentId, "student-1");
});

test("markParentNotificationRead only updates the notifications table for the requested id", async () => {
  const updates = [];
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "parent-user-1" } },
        error: null,
      }),
    },
    from(table) {
      return {
        update(payload) {
          const record = { table, payload, filters: [] };
          const query = {
            eq(column, value) {
              record.filters.push({ type: "eq", column, value });
              if (record.filters.length === 2) {
                updates.push(record);
                return Promise.resolve({ error: null });
              }
              return query;
            },
          };
          return query;
        },
      };
    },
  };

  await markParentNotificationRead("notif-1", fakeClient);

  assert.deepEqual(updates, [
    {
      table: "notifications",
      payload: { is_read: true },
      filters: [
        { type: "eq", column: "id", value: "notif-1" },
        { type: "eq", column: "user_id", value: "parent-user-1" },
      ],
    },
  ]);
});

test("markAllParentNotificationsRead updates all unread direct notifications in one call", async () => {
  const updates = [];
  const fakeClient = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "parent-user-1" } },
        error: null,
      }),
    },
    from(table) {
      return {
        update(payload) {
          const record = { table, payload, filters: [] };
          return {
            eq(column, value) {
              record.filters.push({ type: "eq", column, value });
              return {
                in: async (inColumn, values) => {
                  record.filters.push({ type: "in", column: inColumn, values });
                  updates.push(record);
                  return { error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  await markAllParentNotificationsRead(["notif-1", "notif-2"], fakeClient);

  assert.deepEqual(updates, [
    {
      table: "notifications",
      payload: { is_read: true },
      filters: [
        { type: "eq", column: "user_id", value: "parent-user-1" },
        { type: "in", column: "id", values: ["notif-1", "notif-2"] },
      ],
    },
  ]);
});
