import React from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { ContentDetailSheet } from '../../components/shared/ContentDetailSheet';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FeedCard, FeedCardIcon } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import {
  groupNotificationsForBell,
  listMyNotifications,
  markMyNotificationRead,
} from '../../services/notificationService.js';
import { colors, getRolePalette, spacing } from '../../theme';
import { formatDate } from '../../utils/date';

const typeIcons = {
  announcement: { icon: 'bell', color: colors.primaryStrong, bg: colors.primarySoft },
  fee_payment: { icon: 'credit-card', color: colors.successStrong, bg: colors.successSoft },
  attendance: { icon: 'check-circle', color: colors.warningStrong, bg: colors.warningSoft },
  exam_result: { icon: 'bar-chart-2', color: colors.violet500, bg: colors.infoSoft },
  low_attendance: { icon: 'alert-triangle', color: colors.dangerStrong, bg: colors.dangerSoft },
  general: { icon: 'info', color: colors.muted, bg: colors.surfaceMuted },
};
const notificationSectionOrder = ['School', 'Teacher', 'App'];

export function RoleNotificationsScreen({
  role,
  emptyTitle = 'No notifications',
  emptyMessage = "You're all caught up.",
  summary = 'Recent alerts and updates for your account.',
}) {
  const palette = role ? getRolePalette(role) : {
    accent: colors.primary,
    accentSoft: colors.primarySoft,
    accentStrong: colors.primaryStrong,
    highlight: colors.info,
    highlightSoft: colors.infoSoft,
    surface: colors.surface,
    surfaceMuted: colors.surfaceMuted,
    surfaceRaised: colors.surfaceRaised,
    surfaceSoft: colors.surfaceMuted,
    surfaceGlow: colors.heroGlow,
    border: colors.border,
    borderStrong: colors.borderStrong,
    separator: colors.separator,
    separatorStrong: colors.separatorStrong,
    chip: colors.primarySoft,
    chipText: colors.primaryStrong,
  };
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const [actionError, setActionError] = React.useState('');
  const { data, setData, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    React.useCallback(async () => {
      const rows = await listMyNotifications(50);
      return rows || [];
    }, []),
    { initialData: [] }
  );
  const groups = React.useMemo(
    () =>
      groupNotificationsForBell(data ?? []).sort(
        (left, right) =>
          notificationSectionOrder.indexOf(left.label) - notificationSectionOrder.indexOf(right.label)
      ),
    [data]
  );
  const sections = React.useMemo(
    () => groups.map((group) => ({ ...group, data: group.items || [] })),
    [groups]
  );
  const styles = React.useMemo(() => ({ ...baseStyles, ...createStateStyles(palette) }), [palette]);

  const handleNotificationPress = React.useCallback(
    async (item) => {
      setActionError('');
      setSelectedNotification(item);

      if (item?.is_read) {
        return;
      }

      try {
        await markMyNotificationRead(item.id);
        setData((current) =>
          (current || []).map((entry) =>
            entry.id === item.id ? { ...entry, is_read: true } : entry
          )
        );
      } catch (markError) {
        setActionError(markError?.message || 'Failed to update notification state.');
      }
    },
    [setData]
  );

  if (isLoading) return <LoadingState />;

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const visual = getTypeVisualColor(item.type);
          return (
            <FeedCard
              onPress={() => handleNotificationPress(item)}
              leading={<FeedCardIcon icon={(typeIcons[item.type] || typeIcons.general).icon} color={visual.color} backgroundColor={visual.bg} />}
              eyebrow={item.type || 'notification'}
              title={item.title || 'Notification'}
              message={item.message || 'No details provided.'}
              timestamp={formatDate(item.created_at)}
              unread={!item.is_read}
              accessory={
                <View style={styles.stateWrap}>
                  <Text style={[styles.stateText, !item.is_read ? styles.stateUnread : styles.stateRead]}>
                    {item.is_read ? 'Read' : 'Unread'}
                  </Text>
                </View>
              }
            />
          );
        }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            <FeedSection title={section.label} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        SectionSeparatorComponent={() => <View style={styles.groupGap} />}
        ListHeaderComponent={
          <View style={styles.headerGroup}>
            {error ? <ErrorBanner message={error} onRetry={load} /> : null}
            {actionError ? <ErrorBanner message={actionError} /> : null}

            <FeedHero
              title="Notifications"
              summary={summary}
              chips={[
                `${data?.length || 0} total`,
                `${data?.filter((item) => !item?.is_read).length || 0} unread`,
                groups.length ? `${groups.length} groups` : 'Quiet feed',
              ]}
              accent={palette.accentStrong}
              accentSoft={palette.accentSoft}
              meta={<FeedHeroAction label="Refresh" onPress={refresh} icon="rotate-cw" accent={palette.accentStrong} accentSoft={palette.accentSoft} />}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title={emptyTitle}
            message={emptyMessage}
            actionLabel="Refresh notifications"
            onAction={refresh}
            supportingTone="info"
          />
        }
        contentContainerStyle={[styles.content, (data ?? []).length ? null : styles.contentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      <ContentDetailSheet
        visible={Boolean(selectedNotification)}
        title={selectedNotification?.title || 'Notification'}
        eyebrow="Notification"
        subtitle={selectedNotification?.message || 'No details provided.'}
        timestamp={selectedNotification?.created_at ? formatDate(selectedNotification.created_at) : ''}
        metadataItems={[
          {
            label: 'Source',
            value:
              groups.find((group) => group.items.some((item) => item.id === selectedNotification?.id))
                ?.label || 'School',
          },
          { label: 'Status', value: selectedNotification?.is_read ? 'Read' : 'Unread' },
        ]}
        body={selectedNotification?.message || 'No details provided.'}
        onClose={() => setSelectedNotification(null)}
      />
    </>
  );
}

const baseStyles = StyleSheet.create({
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
});

function createStateStyles(palette) {
  return StyleSheet.create({
    stateWrap: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.surfaceMuted,
      borderWidth: 1,
      borderColor: palette.border,
    },
    stateText: {
      fontSize: 11,
      fontWeight: '800',
    },
    stateUnread: {
      color: palette.accentStrong,
    },
    stateRead: {
      color: palette.muted,
    },
  });
}

function getTypeVisualColor(type) {
  return typeIcons[type] || typeIcons.general;
}
