import { Feather } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { getStudentUpcomingDeadlines } from '../../services/studentService';
import { formatDate } from '../../utils/date';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { colors, radii, shadows, spacing } from '../../theme';

export function StudentAssignmentsScreen() {
  const { data: assignments, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    useCallback(async () => {
      return await getStudentUpcomingDeadlines();
    }, []),
    {
      initialData: [],
    }
  );

  const urgentCount = (assignments || []).filter(a => a.urgent).length;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Learning Tasks</Text>
          <Text style={styles.title}>Assignments</Text>
          <Text style={styles.subtitle}>
            Keep track of your upcoming deadlines and submissions.
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Urgent</Text>
          <Text style={[styles.statValue, urgentCount > 0 ? { color: colors.danger } : null]}>
            {urgentCount}
          </Text>
          <Text style={styles.statMeta}>
            Due very soon
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            <Text style={styles.sectionSubtitle}>
              {assignments.length ? `${assignments.length} items pending` : 'All caught up!'}
            </Text>
          </View>
        </View>

        {assignments.length === 0 ? (
          <EmptyState
            icon="book-open"
            title="No assignments"
            message="Your upcoming assignments and project deadlines will appear here."
          />
        ) : (
          <View style={styles.list}>
            {assignments.map((assignment) => (
              <View key={assignment.id} style={styles.rowCard}>
                <View style={[styles.statusIndicator, { backgroundColor: assignment.urgent ? colors.danger : colors.primary }]} />
                <View style={styles.rowBody}>
                  <Text style={styles.subjectText}>{assignment.subject}</Text>
                  <Text style={styles.titleText}>{assignment.title}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="calendar" size={12} color={colors.muted} />
                    <Text style={[styles.dueText, assignment.urgent ? { color: colors.danger, fontWeight: '800' } : null]}>
                      Due: {formatDate(assignment.due)}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.borderStrong} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl + 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  statCard: {
    width: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statMeta: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  subjectText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
});
