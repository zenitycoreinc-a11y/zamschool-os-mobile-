import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
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
import { getStudentResultsSummary } from '../../services/studentService';
import { formatDate } from '../../utils/date';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { colors, radii, shadows, spacing } from '../../theme';

export function StudentResultsScreen({ currentSummary = { average: null, rows: [] } }) {
  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    useCallback(async () => {
      return await getStudentResultsSummary(50);
    }, []),
    {
      initialData: currentSummary,
    }
  );

  const average = data?.average;
  const rows = data?.rows || [];

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
          <Text style={styles.eyebrow}>Academic Performance</Text>
          <Text style={styles.title}>Results & Grades</Text>
          <Text style={styles.subtitle}>
            Your published exam and assignment results.
          </Text>
        </View>

        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Average</Text>
          <Text style={styles.averageValue}>{currentSummary.average == null ? '--' : `${currentSummary.average}%`}</Text>
          <Text style={styles.averageMeta}>
            Overall weighted score
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Performance History</Text>
            <Text style={styles.sectionSubtitle}>
              {rows.length ? `${rows.length} graded items` : 'No results published yet'}
            </Text>
          </View>
        </View>

        {rows.length === 0 ? (
          <EmptyState
            icon="bar-chart-2"
            title="No results yet"
            message="Your assignment and exam grades will appear here once published by teachers."
          />
        ) : (
          <View style={styles.list}>
            {rows.map((record) => (
              <View key={record.id} style={styles.rowCard}>
                <View style={styles.rowBody}>
                  <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                  <Text style={styles.subjectText}>{record.subject}</Text>
                  <Text style={styles.assignmentText}>
                    {record.assignmentTitle} • {record.className}
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>{record.score}/{record.maxScore}</Text>
                  <View style={[styles.percentageBadge, { backgroundColor: getPercentageColor(record.percentage) + '20' }]}>
                    <Text style={[styles.percentageText, { color: getPercentageColor(record.percentage) }]}>
                      {record.percentage}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getPercentageColor(percentage) {
  if (percentage >= 80) return colors.success;
  if (percentage >= 60) return colors.primary;
  if (percentage >= 40) return colors.warning;
  return colors.danger;
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
  averageCard: {
    width: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  averageLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  averageValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  averageMeta: {
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
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  dateText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subjectText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  assignmentText: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  scoreBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
