import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AvatarCircle } from '../../components/shared/AvatarCircle';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FeedCard } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { listMyMessages } from '../../services/messageService';
import { getRolePalette, spacing } from '../../theme';
import { formatDate } from '../../utils/date';
import { useAsyncResource } from '../../hooks/useAsyncResource';

function displayName(msg) {
  return [msg.other?.first_name, msg.other?.last_name].filter(Boolean).join(' ').trim() || msg.other?.email || 'Unknown User';
}

export function TeacherMessagesScreen() {
  const palette = getRolePalette('teacher');
  const { data: messages, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    useCallback(async () => {
      const rows = await listMyMessages(50);
      return rows || [];
    }, []),
    { initialData: [] }
  );
  const rows = messages || [];
  const unreadIncomingCount = rows.filter((message) => !message.isFromMe && !message.is_read).length;
  const sentCount = rows.filter((message) => message.isFromMe).length;

  if (isLoading) return <LoadingState />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item: message }) => {
        const name = displayName(message);
        return (
          <FeedCard
            leading={<AvatarCircle name={name} avatarUrl={null} size={46} color={palette.accentSoft} />}
            eyebrow={message.isFromMe ? 'Sent' : !message.is_read ? 'Unread' : 'Received'}
            title={name}
            message={message.content}
            timestamp={formatDate(message.created_at)}
            unread={!message.isFromMe && !message.is_read}
            accessory={
              message.subject ? (
                <Text style={styles.subjectChip} numberOfLines={1}>
                  {message.subject}
                </Text>
              ) : null
            }
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.listGap} />}
      ListHeaderComponent={
        <View style={styles.headerGroup}>
          {error ? <ErrorBanner message={error} onRetry={load} /> : null}

          <FeedHero
            title="Messages"
            summary={
              rows.length
                ? unreadIncomingCount > 0
                  ? `${unreadIncomingCount} unread conversation update${unreadIncomingCount === 1 ? '' : 's'} need your attention.`
                  : 'Your teacher inbox is calm. All recent messages have been reviewed.'
                : 'Messages from parents, students, and school staff will land here.'
            }
            chips={[
              `${rows.length} threads`,
              `${sentCount} sent`,
              unreadIncomingCount > 0 ? `${unreadIncomingCount} unread` : 'All read',
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

          {rows.length ? <FeedSection title="Recent conversations" action="Pull to refresh" /> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="inbox"
          title="Inbox is clear"
          message="Messages from parents, students, and school staff will appear here once conversations begin."
          actionLabel="Check again"
          onAction={refresh}
          supportingTone="celebratory"
        />
      }
      contentContainerStyle={[styles.content, rows.length ? null : styles.contentEmpty]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    />
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
  subjectChip: {
    maxWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1ECFF',
    color: '#4628A6',
    fontSize: 11,
    fontWeight: '700',
  },
});
