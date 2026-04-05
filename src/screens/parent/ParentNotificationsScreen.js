import React from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { FeedCard, FeedCardIcon } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import {
  getUnreadParentNotificationIds,
  listParentInboxItems,
  markAllParentNotificationsRead,
  markParentNotificationRead,
} from '../../services/parentInboxService';
import { getRolePalette, spacing } from '../../theme';

function formatTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value || '');
  return parsed.toLocaleString();
}

function getItemVisual(item) {
  const palette = getRolePalette('parent');
  if (item.source === 'event') {
    return { icon: 'calendar', color: palette.accentStrong, bg: palette.accentSoft };
  }
  if (item.source === 'announcement') {
    return { icon: 'bell', color: palette.highlight, bg: palette.surfaceSoft };
  }
  if (item.type === 'attendance') {
    return { icon: 'check-circle', color: palette.accent, bg: palette.surfaceSoft };
  }
  return { icon: 'info', color: palette.accentStrong, bg: palette.accentSoft };
}

export function ParentNotificationsScreen({ onBack, onOpenAttendance, embedded = false }) {
  const palette = getRolePalette('parent');
  const styles = React.useMemo(() => createStyles(palette), [palette]);
  const [actionError, setActionError] = React.useState('');
  const {
    data,
    setData,
    error,
    isLoading,
    refreshing,
    load,
    refresh,
  } = useAsyncResource(
    React.useCallback(async () => {
      const items = await listParentInboxItems();
      return items || [];
    }, []),
    { initialData: [] }
  );

  const items = data || [];
  const unreadIds = getUnreadParentNotificationIds(items);
  const groupedItems = React.useMemo(
    () => groupParentInboxItems(items),
    [items]
  );
  const sections = React.useMemo(
    () => groupedItems.map((group) => ({ ...group, data: group.items || [] })),
    [groupedItems]
  );

  const handleItemPress = React.useCallback(
    async (item) => {
      setActionError('');

      if (item?.source === 'notification' && item?.status === 'unread') {
        try {
          await markParentNotificationRead(item.id);
          setData((current) =>
            (current || []).map((entry) =>
              entry.id === item.id ? { ...entry, status: 'read' } : entry
            )
          );
        } catch (markError) {
          setActionError(markError?.message || 'Failed to update notification state.');
        }
      }

      if (item?.navigation?.route === 'attendance') {
        onOpenAttendance?.(item.navigation.studentId || null);
      }
    },
    [onOpenAttendance, setData]
  );

  const handleMarkAll = React.useCallback(async () => {
    if (unreadIds.length === 0) return;
    setActionError('');
    try {
      await markAllParentNotificationsRead(unreadIds);
      setData((current) =>
        (current || []).map((item) =>
          item.source === 'notification' ? { ...item, status: 'read' } : item
        )
      );
    } catch (markError) {
      setActionError(markError?.message || 'Failed to mark notifications as read.');
    }
  }, [setData, unreadIds]);

  if (isLoading) return <LoadingState />;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.source}-${item.id}`}
      renderItem={({ item }) => {
        const visual = getItemVisual(item);
        const interactive = item.navigation?.route === 'attendance' || item.source === 'notification';
        return (
          <FeedCard
            onPress={interactive ? () => handleItemPress(item) : undefined}
            leading={<FeedCardIcon icon={visual.icon} color={visual.color} backgroundColor={visual.bg} />}
            eyebrow={item.source}
            title={item.title || 'Notification'}
            message={item.body || 'No additional details.'}
            timestamp={formatTimestamp(item.timestamp)}
            unread={item.source === 'notification' && item.status === 'unread'}
            accessory={
              item.navigation?.route === 'attendance' ? (
                <View style={styles.attendancePill}>
                  <Text style={styles.attendancePillText}>Open attendance</Text>
                </View>
              ) : null
            }
          />
        );
      }}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeaderWrap}>
          <FeedSection
            title={section.label}
            action={section.key === 'notification' && unreadIds.length > 0 ? 'Mark read' : ''}
            onAction={section.key === 'notification' && unreadIds.length > 0 ? handleMarkAll : undefined}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.itemGap} />}
      SectionSeparatorComponent={() => <View style={styles.groupGap} />}
      ListHeaderComponent={
        <View style={styles.headerGroup}>
          {embedded ? null : (
            <View style={styles.topRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={onBack}
                style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <Text style={styles.topHint}>{unreadIds.length} unread</Text>
            </View>
          )}

          {error ? <ErrorBanner message={error} onRetry={load} /> : null}
          {actionError ? <ErrorBanner message={actionError} /> : null}

          <FeedHero
            title="Parent Inbox"
            summary="Attendance alerts, school notices, and events in one place."
            chips={[
              `${items.length} total`,
              `${unreadIds.length} unread`,
              groupedItems.length ? `${groupedItems.length} sections` : 'Quiet feed',
            ]}
            accent={palette.accentStrong}
            accentSoft={palette.accentSoft}
            meta={
              <View style={styles.heroActions}>
                {unreadIds.length > 0 ? (
                  <FeedHeroAction
                    label="Mark all read"
                    onPress={handleMarkAll}
                    icon="check-circle"
                    accent={palette.accentStrong}
                    accentSoft={palette.accentSoft}
                  />
                ) : null}
                <FeedHeroAction
                  label="Refresh"
                  onPress={refresh}
                  icon="rotate-cw"
                  accent={palette.accentStrong}
                  accentSoft={palette.accentSoft}
                />
              </View>
            }
          />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="bell"
          title="No updates yet"
          message="Attendance alerts, notices, and events will appear here."
          actionLabel="Refresh inbox"
          onAction={refresh}
          supportingTone="info"
        />
      }
      contentContainerStyle={[styles.content, items.length ? null : styles.contentEmpty]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
}

function createStyles(palette) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl + spacing.xl,
    },
    contentEmpty: {
      flexGrow: 1,
    },
    headerGroup: {
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    backButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backButtonPressed: {
      opacity: 0.9,
    },
    backButtonText: {
      color: palette.accentStrong,
      fontSize: 12,
      fontWeight: '800',
    },
    topHint: {
      color: palette.muted,
      fontSize: 12,
      fontWeight: '800',
    },
    heroActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    sectionHeaderWrap: {
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    itemGap: {
      height: spacing.sm,
    },
    groupGap: {
      height: spacing.sm,
    },
    attendancePill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
    },
    attendancePillText: {
      color: palette.accentStrong,
      fontSize: 11,
      fontWeight: '800',
    },
  });
}

function groupParentInboxItems(items = []) {
  const groups = [
    { key: 'notification', label: 'Alerts', items: [] },
    { key: 'announcement', label: 'Announcements', items: [] },
    { key: 'event', label: 'Events', items: [] },
  ];

  for (const item of items || []) {
    const bucket = groups.find((group) => group.key === item.source) || groups[0];
    bucket.items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}
