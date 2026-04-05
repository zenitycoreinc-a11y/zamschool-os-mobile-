const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';
const IOS_PERMISSION_OPTIONS = {
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
};
const shouldLoadNativeNotifications =
  process.env.EXPO_PUBLIC_ENABLE_NATIVE_NOTIFICATIONS === 'true';

async function resolveNotificationDeps(overrides = {}) {
  if (
    Object.prototype.hasOwnProperty.call(overrides, 'notifications') &&
    overrides.Platform &&
    overrides.Linking
  ) {
    return overrides;
  }

  let notifications = overrides.notifications;
  let notificationError = overrides.notificationError || null;
  if (typeof notifications === 'undefined') {
    if (!shouldLoadNativeNotifications) {
      notifications = null;
      notificationError = new Error('Notifications native module disabled for this build.');
    } else {
      try {
        notifications = await import('expo-notifications');
      } catch (error) {
        notifications = null;
        notificationError = error;
      }
    }
  }
  const reactNative = await import('react-native');

  return {
    notifications,
    Platform: overrides.Platform || reactNative.Platform,
    Linking: overrides.Linking || reactNative.Linking,
    notificationError,
  };
}

function buildUnavailablePermissionState(error) {
  return {
    status: 'unavailable',
    granted: false,
    canAskAgain: false,
    systemStatus: 'unavailable',
    shouldOpenSettings: false,
    notificationModuleAvailable: false,
    reason: error?.message || 'Notifications native module unavailable.',
  };
}

export function normalizeNotificationPermission(permission = {}) {
  const systemStatus = permission.status || 'undetermined';

  if (permission.granted || systemStatus === 'granted') {
    return {
      status: 'granted',
      granted: true,
      canAskAgain: permission.canAskAgain !== false,
      systemStatus,
      shouldOpenSettings: false,
      notificationModuleAvailable: true,
    };
  }

  if (systemStatus === 'denied' && permission.canAskAgain === false) {
    return {
      status: 'blocked',
      granted: false,
      canAskAgain: false,
      systemStatus,
      shouldOpenSettings: true,
      notificationModuleAvailable: true,
    };
  }

  if (systemStatus === 'denied') {
    return {
      status: 'denied',
      granted: false,
      canAskAgain: permission.canAskAgain !== false,
      systemStatus,
      shouldOpenSettings: false,
      notificationModuleAvailable: true,
    };
  }

  return {
    status: 'undetermined',
    granted: false,
    canAskAgain: permission.canAskAgain !== false,
    systemStatus,
    shouldOpenSettings: false,
    notificationModuleAvailable: true,
  };
}

async function ensureAndroidNotificationChannel(deps) {
  if (deps.Platform?.OS !== 'android' || typeof deps.notifications?.setNotificationChannelAsync !== 'function') {
    return false;
  }

  await deps.notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: 'Default',
    importance: deps.notifications.AndroidImportance?.DEFAULT ?? 3,
  });

  return true;
}

export async function getNotificationPermissionState(overrides) {
  const deps = await resolveNotificationDeps(overrides);
  if (!deps.notifications || typeof deps.notifications.getPermissionsAsync !== 'function') {
    return buildUnavailablePermissionState(deps.notificationError);
  }
  const permission = await deps.notifications.getPermissionsAsync();
  return normalizeNotificationPermission(permission);
}

export async function requestNotificationPermission(overrides) {
  const deps = await resolveNotificationDeps(overrides);
  if (!deps.notifications || typeof deps.notifications.requestPermissionsAsync !== 'function') {
    return buildUnavailablePermissionState(deps.notificationError);
  }

  await ensureAndroidNotificationChannel(deps);

  const permission = await deps.notifications.requestPermissionsAsync(IOS_PERMISSION_OPTIONS);
  return normalizeNotificationPermission(permission);
}

export async function openNotificationSettings(overrides) {
  const deps = await resolveNotificationDeps(overrides);

  if (typeof deps.Linking?.openSettings !== 'function') {
    return false;
  }

  await deps.Linking.openSettings();
  return true;
}
