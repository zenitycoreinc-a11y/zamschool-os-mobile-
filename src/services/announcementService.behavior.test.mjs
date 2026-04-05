import test from "node:test";
import assert from "node:assert/strict";

import { __resetReadMostlyCacheForTests } from "./readMostlyCache.js";
import { createAnnouncement, listAnnouncements, peekAnnouncements } from "./announcementService.js";

test.beforeEach(() => {
  __resetReadMostlyCacheForTests();
});

test("listAnnouncements reuses a short-lived cached feed for quick tab returns", async () => {
  const calls = [];
  const requestFn = async (path) => {
    calls.push(path);
    return {
      data: [
        {
          id: "announcement-1",
          title: "Exam week",
          body: "Starts Monday",
          target_role: "ALL",
        },
      ],
    };
  };

  const first = await listAnnouncements(20, requestFn);
  const second = await listAnnouncements(20, requestFn);

  assert.deepEqual(calls, ["/api/account/announcements?limit=20"]);
  assert.deepEqual(second, first);
  assert.deepEqual(peekAnnouncements(20), first);
});

test("createAnnouncement publishes through the admin API route", async () => {
  const calls = [];
  const payload = await createAnnouncement(
    {
      title: "Exam week",
      body: "Starts Monday",
    },
    async (path, options) => {
      calls.push([path, options]);
      return {
        data: {
          id: "announcement-1",
          title: "Exam week",
          content: "Starts Monday",
        },
      };
    }
  );

  assert.deepEqual(calls, [
    [
      "/api/admin/announcements",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Exam week",
          content: "Starts Monday",
          targetRole: null,
          targetClassId: null,
          isPinned: false,
          expiresAt: null,
        }),
      },
    ],
  ]);
  assert.equal(payload.content, "Starts Monday");
  assert.equal(payload.body, "Starts Monday");
});
