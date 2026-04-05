import test from "node:test";
import assert from "node:assert/strict";
import { scheduleUnreadRefresh } from "./premiumShellUnreadRefresh.js";

test("unread refresh defers the first fetch, subscribes to app visibility, and does not poll", () => {
  const events = [];
  let deferredTask = null;
  let appStateListener = null;

  const cleanup = scheduleUnreadRefresh({
    defer(task) {
      events.push("defer");
      deferredTask = task;
      return {
        cancel() {
          events.push("cancel");
        },
      };
    },
    subscribe(listener) {
      events.push("subscribe");
      return () => {
        events.push("unsubscribe");
      };
    },
    subscribeToAppState(listener) {
      events.push("app-state");
      appStateListener = listener;
      return () => {
        events.push("remove-app-state");
      };
    },
    onAppStateActive() {
      events.push("active");
    },
    onRefresh() {
      events.push("refresh");
    },
  });

  assert.deepEqual(events, ["defer", "subscribe", "app-state"]);
  assert.equal(typeof deferredTask, "function");
  assert.equal(typeof appStateListener, "function");

  deferredTask();
  assert.deepEqual(events, ["defer", "subscribe", "app-state", "refresh"]);

  appStateListener("background");
  assert.deepEqual(events, ["defer", "subscribe", "app-state", "refresh"]);

  appStateListener("active");
  assert.deepEqual(events, ["defer", "subscribe", "app-state", "refresh", "active", "refresh"]);

  cleanup();
  assert.deepEqual(events, [
    "defer",
    "subscribe",
    "app-state",
    "refresh",
    "active",
    "refresh",
    "cancel",
    "unsubscribe",
    "remove-app-state",
  ]);
});

test("cleanup prevents deferred, app-state, and subscription refreshes from firing after teardown", () => {
  let deferredTask = null;
  let subscriptionTask = null;
  let appStateListener = null;
  let refreshCount = 0;

  const cleanup = scheduleUnreadRefresh({
    defer(task) {
      deferredTask = task;
      return {
        cancel() {},
      };
    },
    subscribe(listener) {
      subscriptionTask = listener;
      return () => {};
    },
    subscribeToAppState(listener) {
      appStateListener = listener;
      return () => {};
    },
    onAppStateActive() {},
    onRefresh() {
      refreshCount += 1;
    },
  });

  cleanup();
  deferredTask();
  subscriptionTask();
  appStateListener("active");

  assert.equal(refreshCount, 0);
});
