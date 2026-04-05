import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AttendanceBadge } from '../../components/ui/AttendanceBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { getStudentDashboard } from '../../services/studentDashboardService.js';
import { formatDate } from '../../utils/date';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { colors, radii, shadows, spacing } from '../../theme';

const SUMMARY_TONES = {
  PRESENT: {
    icon: 'check-circle',
    backgroundColor: colors.successSoft,
    color: colors.successStrong,
  },
  ABSENT: {
    icon: 'x-circle',
    backgroundColor: colors.dangerSoft,
    color: colors.dangerStrong,
  },
  LATE: {
    icon: 'clock',
    backgroundColor: colors.warningSoft,
    color: colors.warningStrong,
  },
  EXCUSED: {
    icon: 'shield',
    backgroundColor: colors.infoSoft,
    color: colors.infoStrong,
  },
};

function getSummaryCount(summary) {
  return (
    Number(summary?.PRESENT || 0) +
    Number(summary?.ABSENT || 0) +
    Number(summary?.LATE || 0) +
    Number(summary?.EXCUSED || 0)
  );
}

function getPartialState(summary, rows) {
  const total = Number(summary?.total || 0);
  const summaryCount = getSummaryCount(summary);

  if (rows.length === 0 && total > 0) {
    return {
      title: 'Attendance is still syncing',
      message: 'Your summary is available, but the lesson-by-lesson history has not finished loading yet.',
    };
  }

  if (rows.length > 0 && total === 0) {
    return {
      title: 'History is available first',
      message: 'Recent rollcall entries are visible, but the summary counters are still catching up.',
    };
  }

  if (summaryCount > 0 && total === 0) {
    return {
      title: 'Summary needs a refresh',
      message: 'Some attendance counters look incomplete. Pull down to refresh and load the latest totals.',
    };
  }

  return null;
}

function SummaryTile({ label, value, icon, backgroundColor, color }) {
  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, { backgroundColor }]}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export function StudentAttendanceScreen() {
  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    useCallback(async () => {
      const dashboard = await getStudentDashboard();
      return dashboard.attendance;
    }, []),
    {
      initialData: {
        summary: {
          PRESENT: 0,
          ABSENT: 0,
          LATE: 0,
          EXCUSED: 0,
          total: 0,
          rate: 0,
        },
        rows: [],
      },
    }
  );

  const summary = data?.summary || {};
  const rows = data?.rows || [];
  const partialState = getPartialState(summary, rows);

  const summaryTiles = useMemo(
    () => [
      { key: 'PRESENT', label: 'Present', value: summary.PRESENT || 0 },
      { key: 'ABSENT', label: 'Absent', value: summary.ABSENT || 0 },
      { key: 'LATE', label: 'Late', value: summary.LATE || 0 },
      { key: 'EXCUSED', label: 'Excused', value: summary.EXCUSED || 0 },
    ],
    [summary.ABSENT, summary.EXCUSED, summary.LATE, summary.PRESENT]
  );

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
          <Text style={styles.eyebrow}>Attendance</Text>
          <Text style={styles.title}>Rollcall overview</Text>
          <Text style={styles.subtitle}>
            Lesson attendance recorded from your teacher&apos;s rollcall.
          </Text>
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Rate</Text>
          <Text style={styles.rateValue}>{summary.rate || 0}%</Text>
          <Text style={styles.rateMeta}>
            {summary.total ? `${summary.total} sessions recorded` : 'No sessions recorded yet'}
          </Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        {summaryTiles.map((tile) => {
          const tone = SUMMARY_TONES[tile.key];
          return (
            <SummaryTile
              key={tile.key}
              label={tile.label}
              value={tile.value}
              icon={tone.icon}
              backgroundColor={tone.backgroundColor}
              color={tone.color}
            />
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>History</Text>
            <Text style={styles.sectionSubtitle}>
              {partialState
                ? 'Some attendance details are still syncing'
                : rows.length
                  ? `${rows.length} recorded lessons`
                  : 'No attendance records yet'}
            </Text>
          </View>
        </View>

        {partialState ? (
          <View style={styles.partialStateCard}>
            <View style={styles.partialStateIcon}>
              <Feather name="refresh-cw" size={15} color={colors.infoStrong} />
            </View>
            <View style={styles.partialStateCopy}>
              <Text style={styles.partialStateTitle}>{partialState.title}</Text>
              <Text style={styles.partialStateMessage}>{partialState.message}</Text>
            </View>
          </View>
        ) : null}

        {!partialState && rows.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="No attendance records"
            message="Your lesson rollcall entries will appear here once they are published."
          />
        ) : rows.length > 0 ? (
          <View style={styles.list}>
            {rows.map((record) => (
              <View key={record.id} style={styles.rowCard}>
                <View style={styles.rowBody}>
                  <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                  <Text style={styles.subjectText}>{record.subjectName}</Text>
                  <Text style={styles.sessionText}>
                    {record.timeLabel} - {record.teacherName}
                  </Text>
                </View>
                <AttendanceBadge status={record.status} />
              </View>
            ))}
          </View>
        ) : null}
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
  rateCard: {
    width: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rateLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rateValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rateMeta: {
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryTile: {
    width: '48.2%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
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
  partialStateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.infoSoft,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
  },
  partialStateIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  partialStateCopy: {
    flex: 1,
    gap: 4,
  },
  partialStateTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  partialStateMessage: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
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
  sessionText: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
