import test from "node:test";
import assert from "node:assert/strict";
import {
  getNotificationPermissionState,
  normalizeNotificationPermission,
  openNotificationSettings,
  requestNotificationPermission,
} from "./notificationPermissions.js";

test("normalizeNotificationPermission maps Expo permission states into app-friendly states", () => {
  assert.deepEqual(
    normalizeNotificationPermission({ status: "granted", granted: true, canAskAgain: true }),
    {
      status: "granted",
      granted: true,
      canAskAgain: true,
      systemStatus: "granted",
      shouldOpenSettings: false,
      notificationModuleAvailable: true,
    },
  );

  assert.deepEqual(
    normalizeNotificationPermission({ status: "denied", granted: false, canAskAgain: true }),
    {
      status: "denied",
      granted: false,
      canAskAgain: true,
      systemStatus: "denied",
      shouldOpenSettings: false,
      notificationModuleAvailable: true,
    },
  );

  assert.deepEqual(
    normalizeNotificationPermission({ status: "denied", granted: false, canAskAgain: false }),
    {
      status: "blocked",
      granted: false,
      canAskAgain: false,
      systemStatus: "denied",
      shouldOpenSettings: true,
      notificationModuleAvailable: true,
    },
  );
});

test("getNotificationPermissionState returns the normalized permission shape", async () => {
  const permissionState = await getNotificationPermissionState({
    notifications: {
      getPermissionsAsync: async () => ({ status: "undetermined", granted: false, canAskAgain: true }),
    },
    Platform: { OS: "android" },
    Linking: {},
  });

  assert.deepEqual(permissionState, {
    status: "undetermined",
    granted: false,
    canAskAgain: true,
    systemStatus: "undetermined",
    shouldOpenSettings: false,
    notificationModuleAvailable: true,
  });
});

test("getNotificationPermissionState degrades gracefully when the native notifications module is unavailable", async () => {
  const permissionState = await getNotificationPermissionState({
    notifications: null,
    notificationError: new Error("Cannot find native module 'ExpoPushTokenManager'"),
    Platform: { OS: "android" },
    Linking: {},
  });

  assert.deepEqual(permissionState, {
    status: "unavailable",
    granted: false,
    canAskAgain: false,
    systemStatus: "unavailable",
    shouldOpenSettings: false,
    notificationModuleAvailable: false,
    reason: "Cannot find native module 'ExpoPushTokenManager'",
  });
});

test("requestNotificationPermission creates the Android notification channel before prompting", async () => {
  const calls = [];
  const permissionState = await requestNotificationPermission({
    notifications: {
      AndroidImportance: { DEFAULT: 4 },
      async setNotificationChannelAsync(channelId, channelConfig) {
        calls.push(["channel", channelId, channelConfig]);
      },
      async requestPermissionsAsync(requestConfig) {
        calls.push(["request", requestConfig]);
        return { status: "denied", granted: false, canAskAgain: false };
      },
    },
    Platform: { OS: "android" },
    Linking: {},
  });

  assert.deepEqual(calls, [
    ["channel", "default", { name: "Default", importance: 4 }],
    [
      "request",
      {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      },
    ],
  ]);
  assert.deepEqual(permissionState, {
    status: "blocked",
    granted: false,
    canAskAgain: false,
    systemStatus: "denied",
    shouldOpenSettings: true,
    notificationModuleAvailable: true,
  });
});

test("requestNotificationPermission returns an unavailable state when the native notifications module is missing", async () => {
  const permissionState = await requestNotificationPermission({
    notifications: null,
    notificationError: new Error("Cannot find native module 'ExpoPushTokenManager'"),
    Platform: { OS: "android" },
    Linking: {},
  });

  assert.deepEqual(permissionState, {
    status: "unavailable",
    granted: false,
    canAskAgain: false,
    systemStatus: "unavailable",
    shouldOpenSettings: false,
    notificationModuleAvailable: false,
    reason: "Cannot find native module 'ExpoPushTokenManager'",
  });
});

test("openNotificationSettings falls back to native app settings", async () => {
  const calls = [];
  const opened = await openNotificationSettings({
    notifications: {},
    Platform: { OS: "android" },
    Linking: {
      async openSettings() {
        calls.push("openSettings");
      },
    },
  });

  assert.equal(opened, true);
  assert.deepEqual(calls, ["openSettings"]);
});
