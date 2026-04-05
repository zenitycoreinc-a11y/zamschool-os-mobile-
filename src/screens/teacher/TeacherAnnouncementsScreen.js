import { useCallback, useState } from 'react';
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

export function TeacherAnnouncementsScreen() {
  const palette = getRolePalette('teacher');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { data: items, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    useCallback(async () => {
      const rows = await listAnnouncements(20);
      return rows || [];
    }, []),
    { initialData: [] }
  );

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
            message={item.body || item.content || 'No notice details provided.'}
            timestamp={formatDate(item.created_at || item.published_at)}
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
                  ? 'School-wide notices, operational updates, and reminders that affect your classes.'
                  : 'Published school notices appear here once there is something your teaching day should know.'
              }
              chips={[
                `${items.length} notices`,
                items.length ? 'Classroom ready' : 'Quiet channel',
                'Tap any notice for details',
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

            {items.length ? <FeedSection title="Latest notices" action="Tap to open" /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No announcements"
            message="No school notices are active right now."
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
          { label: 'Audience', value: 'Teacher account' },
          { label: 'Source', value: 'School' },
        ]}
        body={selectedAnnouncement?.body || selectedAnnouncement?.content || 'No notice details provided.'}
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
