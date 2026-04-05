import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarCircle } from './AvatarCircle';
import { PremiumHeader } from './PremiumHeader';
import { PremiumSidebar } from './PremiumSidebar';
import { RoleShellFrame } from './RoleShellFrame';
import { RoleTabBar } from './RoleTabBar';
import { scheduleUnreadRefresh } from './premiumShellUnreadRefresh.js';
import {
  getMyUnreadSummary,
  subscribeToNotificationUpdates,
} from '../../services/notificationService.js';
import { colors, getRolePalette, shadows, spacing } from '../../theme';
import { useDashboardTheme } from '../../dashboardTheme';

function deferUnreadRefresh(task) {
  if (typeof globalThis.requestIdleCallback === 'function') {
    const handle = globalThis.requestIdleCallback(() => task());
    return {
      cancel() {
        globalThis.cancelIdleCallback?.(handle);
      },
    };
  }

  const timeoutId = setTimeout(task, 0);
  return {
    cancel() {
      clearTimeout(timeoutId);
    },
  };
}

export function PremiumShell({
  role = 'student',
  profile,
  title,
  subtitle,
  items = [],
  activeKey,
  onSelect,
  onSignOut,
  bottomTabs = [],
  overlay = null,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const palette = getRolePalette(role);
  const { mode, theme, toggleMode } = useDashboardTheme();
  const hasBottomTabs = bottomTabs.length > 0;
  const hasProfileRoute = items.some((item) => item.key === 'profile');
  const hasNotificationsRoute = items.some((item) => item.key === 'notifications');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!hasNotificationsRoute) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const summary = await getMyUnreadSummary();
      const nextCount = Number(summary?.notifications || 0);
      setUnreadNotificationCount((current) => (current === nextCount ? current : nextCount));
    } catch {
      setUnreadNotificationCount((current) => current || 0);
    }
  }, [hasNotificationsRoute]);

  useEffect(() => {
    if (!hasNotificationsRoute) {
      setUnreadNotificationCount(0);
      return undefined;
    }

    return scheduleUnreadRefresh({
      defer: deferUnreadRefresh,
      subscribe: subscribeToNotificationUpdates,
      subscribeToAppState: (listener) => {
        const subscription = AppState.addEventListener('change', listener);
        return () => subscription.remove();
      },
      onAppStateActive: refreshUnreadCount,
      onRefresh: refreshUnreadCount,
    });
  }, [hasNotificationsRoute, refreshUnreadCount]);

  useEffect(() => {
    if (!hasNotificationsRoute) {
      return;
    }

    refreshUnreadCount();
  }, [activeKey, hasNotificationsRoute, refreshUnreadCount]);

  const formattedUnreadCount = useMemo(
    () => formatUnreadCount(unreadNotificationCount),
    [unreadNotificationCount]
  );
  const themeToggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Switch dashboard theme"
      onPress={toggleMode}
      style={({ pressed }) => [
        styles.themeToggle,
        {
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.borderStrong,
        },
        pressed ? styles.iconButtonPressed : null,
      ]}
    >
      <View
        style={[
          styles.themeToggleIcon,
          {
            backgroundColor: mode === 'midnight' ? theme.colors.buttonStrong : theme.colors.indicator,
          },
        ]}
      >
        <Feather
          name={mode === 'midnight' ? 'moon' : 'sun'}
          size={14}
          color={mode === 'midnight' ? theme.colors.buttonStrongText : '#FFFFFF'}
        />
      </View>
      <Text style={[styles.themeToggleText, { color: theme.colors.textStrong }]}>
        {mode === 'midnight' ? 'Midnight' : 'Light'}
      </Text>
    </Pressable>
  );
  const profileShortcut = hasProfileRoute ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={() => onSelect?.('profile')}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.border,
        },
        pressed ? styles.iconButtonPressed : null,
      ]}
    >
      <AvatarCircle
        name={profile?.fullName || 'User'}
        avatarUrl={profile?.avatarUrl || null}
        size={40}
        color={palette.accentSoft}
      />
    </Pressable>
  ) : null;
  const headerActions = (
    <View style={styles.shortcutsRow}>
      {themeToggle}
      {hasNotificationsRoute ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          onPress={() => onSelect?.('notifications')}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderColor: theme.colors.border,
            },
            pressed ? styles.iconButtonPressed : null,
          ]}
        >
          <View style={[styles.notificationGlyph, { backgroundColor: palette.accentSoft }]}>
            <Feather name="bell" size={16} color={palette.accentStrong} />
            {formattedUnreadCount ? (
              <View pointerEvents="none" style={styles.notificationBadgeOverlay}>
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      backgroundColor: palette.accentStrong,
                      borderColor: theme.colors.surfaceRaised,
                    },
                  ]}
                >
                  <Text style={styles.notificationBadgeText}>{formattedUnreadCount}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Pressable>
      ) : null}
      {profileShortcut}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <LinearGradient colors={theme.chromeGradient} style={StyleSheet.absoluteFillObject} />
      <PremiumSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        profile={profile}
        items={items}
        activeKey={activeKey}
        onSelect={(key) => {
          setSidebarOpen(false);
          onSelect?.(key);
        }}
        onSignOut={async () => {
          setSidebarOpen(false);
          await onSignOut?.();
        }}
        />

      <PremiumHeader
        role={role}
        title={title}
        subtitle={subtitle}
        profile={profile}
        onMenuPress={() => setSidebarOpen(true)}
        rightSlot={headerActions}
      />

      <RoleShellFrame>{children}</RoleShellFrame>
      {overlay}

      {hasBottomTabs ? (
        <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
          <RoleTabBar
            bottomTabs={bottomTabs}
            activeKey={activeKey}
            onSelect={onSelect}
            accent={palette.accent}
            accentSoft={palette.accentSoft}
            accentStrong={palette.accentStrong}
          />
        </View>
      ) : null}
    </View>
  );
}

function formatUnreadCount(unreadNotificationCount) {
  if (!unreadNotificationCount || unreadNotificationCount < 1) {
    return '';
  }

  return unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.card,
  },
  iconButtonPressed: {
    opacity: 0.9,
  },
  themeToggle: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
  },
  themeToggleIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  notificationGlyph: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadgeOverlay: {
    position: 'absolute',
    top: -4,
    right: -7,
  },
  notificationBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeTextWrap: {
    minWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bottomWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
});
