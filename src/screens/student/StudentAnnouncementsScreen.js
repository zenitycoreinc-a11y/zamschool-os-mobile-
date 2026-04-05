import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ContentDetailSheet } from '../../components/shared/ContentDetailSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { FeedCard, FeedCardIcon } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { listAnnouncements } from '../../services/announcementService';
import { getRolePalette, spacing } from '../../theme';
import { formatDate } from '../../utils/date';

export function StudentAnnouncementsScreen() {
  const palette = getRolePalette('student');
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState(null);
  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    React.useCallback(async () => {
      const rows = await listAnnouncements(50);
      return rows || [];
    }, []),
    { initialData: [] }
  );
  const items = data ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <FeedCard
            onPress={() => setSelectedAnnouncement(item)}
            leading={<FeedCardIcon icon="bell" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
            eyebrow="School notice"
            title={item.title || 'Announcement'}
            message={item.body || item.content || 'No announcement details available.'}
            timestamp={formatDate(item.created_at || item.published_at)}
            accessory={null}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        ListHeaderComponent={
          <View style={styles.headerGroup}>
            {error ? <ErrorBanner message={error} onRetry={load} /> : null}

            <FeedHero
              title="Announcements"
              summary={
                items.length
                  ? 'Published school notices and important updates for your day-to-day student workflow.'
                  : 'School notices and important updates appear here once they are published.'
              }
              chips={[
                `${items.length} notices`,
                items[0]?.title ? `Latest: ${items[0].title}` : 'School updates',
                'Read and revisit anytime',
              ]}
              accent={palette.accentStrong}
              accentSoft={palette.accentSoft}
              meta={
                <FeedHeroAction
                  label="Refresh"
                  onPress={refresh}
                  icon="rotate-cw"
                  accent={palette.accentStrong}
                  accentSoft={palette.accentSoft}
                />
              }
            />

            {items.length ? <FeedSection title="Recent notices" action="Tap to open" /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No announcements"
            message="Check back later for school notices and class-wide updates."
            actionLabel="Refresh notices"
            onAction={refresh}
            supportingTone="info"
          />
        }
        contentContainerStyle={[styles.content, items.length ? null : styles.contentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      />

      <ContentDetailSheet
        visible={Boolean(selectedAnnouncement)}
        title={selectedAnnouncement?.title || 'Announcement'}
        eyebrow="School notice"
        subtitle="Published update"
        timestamp={
          selectedAnnouncement?.created_at || selectedAnnouncement?.published_at
            ? formatDate(selectedAnnouncement.created_at || selectedAnnouncement.published_at)
            : ''
        }
        metadataItems={[
          { label: 'Audience', value: 'Student account' },
          { label: 'Source', value: 'School' },
        ]}
        body={selectedAnnouncement?.body || selectedAnnouncement?.content || 'No announcement details available.'}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  headerGroup: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listGap: {
    height: spacing.sm,
  },
});
