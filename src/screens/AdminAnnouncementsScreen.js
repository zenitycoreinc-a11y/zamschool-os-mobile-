import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { FeedCard, FeedCardIcon } from '../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../components/ui/FeedHero';
import { FeedSection } from '../components/ui/FeedSection';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Input } from '../components/Input';
import { createAnnouncement, listAnnouncements } from '../services/announcementService';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { getRolePalette, radii, shadows, spacing } from '../theme';
import { formatDate } from '../utils/date';

export function AdminAnnouncementsScreen({ profile }) {
  const palette = getRolePalette('admin');
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const {
    run: runPublish,
    isRunning: saving,
    error: publishError,
    setError: setPublishError,
  } = useAsyncAction(
    useCallback(async () => {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        schoolId: profile?.schoolId || null,
      });
    }, [body, profile?.schoolId, title])
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    setPublishError('');
    try {
      const rows = await listAnnouncements();
      setItems(rows || []);
    } catch (error) {
      setMessage(error.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [setPublishError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!title.trim() || !body.trim()) {
      setMessage('Title and body are required.');
      return;
    }

    setMessage('');
    try {
      await runPublish();
      setTitle('');
      setBody('');
      setMessage('Announcement published.');
      await load();
    } catch (error) {
      setMessage(error.message || publishError || 'Create announcement failed.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {message ? <ErrorBanner message={message} onRetry={message.includes('Failed') ? load : undefined} /> : null}
      {publishError && publishError !== message ? <ErrorBanner message={publishError} /> : null}

      <FeedHero
        title="Announcements"
        summary="Publish school notices from the admin workspace and keep the active channel clean and readable."
        chips={[
          profile?.fullName || 'Admin',
          `${items.length} notices`,
          loading ? 'Refreshing' : 'Ready to publish',
        ]}
        accent={palette.accentStrong}
        accentSoft={palette.accentSoft}
        meta={
          <FeedHeroAction
            label="Refresh"
            onPress={load}
            icon="rotate-cw"
            accent={palette.accentStrong}
            accentSoft={palette.accentSoft}
          />
        }
      />

      <FeedSection title="Publish notice" action="Admin channel">
        <View style={[styles.editorCard, { borderColor: palette.border, backgroundColor: palette.surfaceRaised }]}>
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Term opening briefing" />
          <Input label="Body" value={body} onChangeText={setBody} multiline placeholder="Announcement details..." />
          <Button label={saving ? 'Publishing...' : 'Publish'} onPress={handleCreate} disabled={saving} />
        </View>
      </FeedSection>

      <FeedSection title={loading ? 'Recent notices (loading...)' : 'Recent notices'} action={items.length ? 'Latest first' : ''}>
        {items.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No announcements yet"
            message="Publish the first school notice to open the admin announcement channel."
            supportingTone="info"
          />
        ) : (
          items.map((item) => (
            <FeedCard
              key={item.id}
              leading={<FeedCardIcon icon="bell" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
              eyebrow="Published notice"
              title={item.title || 'Untitled'}
              message={item.body || ''}
              timestamp={formatDate(item.created_at || item.published_at)}
            />
          ))
        )}
      </FeedSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  editorCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
});
