import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AvatarCircle } from '../../components/shared/AvatarCircle';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { FeedCard } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { listMyMessages } from '../../services/messageService';
import { getRolePalette, spacing } from '../../theme';
import { formatDate } from '../../utils/date';

function fullNameFromRecord(record) {
  if (!record) return 'Unknown User';
  return [record.first_name, record.last_name].filter(Boolean).join(' ').trim() || record.email || 'Unknown User';
}

export function StudentMessagesScreen() {
  const palette = getRolePalette('student');
  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    React.useCallback(async () => {
      const rows = await listMyMessages(50);
      return rows || [];
    }, []),
    { initialData: [] }
  );
  const messages = data ?? [];
  const unreadIncomingCount = messages.filter((message) => !message.isFromMe && !message.is_read).length;
  const latestContact = messages[0]?.other || null;
  const latestContactName = fullNameFromRecord(latestContact);

  if (isLoading) return <LoadingState />;

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item: msg }) => {
        const name = fullNameFromRecord(msg.other);
        return (
          <FeedCard
            leading={<AvatarCircle name={name} avatarUrl={null} size={46} color={palette.accentSoft} />}
            eyebrow={msg.isFromMe ? 'Sent' : !msg.is_read ? 'Unread' : 'Received'}
            title={name}
            message={msg.content}
            timestamp={formatDate(msg.created_at)}
            unread={!msg.is_read && !msg.isFromMe}
            accessory={
              msg.subject ? (
                <Text style={styles.subjectChip} numberOfLines={1}>
                  {msg.subject}
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
            title="Inbox"
            summary={
              messages.length
                ? unreadIncomingCount > 0
                  ? `${unreadIncomingCount} unread message${unreadIncomingCount === 1 ? '' : 's'} waiting for you.`
                  : 'You are caught up on messages from teachers and school staff.'
                : 'Messages from teachers and school staff appear here once conversations start.'
            }
            chips={[
              `${messages.length} total`,
              unreadIncomingCount > 0 ? `${unreadIncomingCount} unread` : 'All read',
              messages.length ? `Latest: ${latestContactName}` : 'Quiet inbox',
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

          {messages.length ? <FeedSection title="Latest messages" action="Pull to refresh" /> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="message-circle"
          title="No messages yet"
          message="Teacher and school messages will appear here. Once someone reaches out, this inbox becomes your quiet command center."
          actionLabel="Refresh inbox"
          onAction={refresh}
          supportingTone="info"
        />
      }
      contentContainerStyle={[styles.content, messages.length ? null : styles.contentEmpty]}
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
    backgroundColor: '#EAF1FF',
    color: '#153E8A',
    fontSize: 11,
    fontWeight: '600',
  },
});
