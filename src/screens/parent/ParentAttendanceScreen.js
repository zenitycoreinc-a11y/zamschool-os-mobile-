import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AttendanceBadge } from '../../components/ui/AttendanceBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { FeedCard } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { getParentAttendance, peekParentAttendance } from '../../services/parentService';
import { getRolePalette, radii, shadows, spacing } from '../../theme';
import { formatDate } from '../../utils/date';

const RANGE_OPTIONS = [
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
];

function formatTimeLabel(value) {
  const text = String(value || '').trim();
  return text.length >= 5 ? text.slice(0, 5) : text || null;
}

function getStatusTone(status, palette) {
  switch (String(status || '').toUpperCase()) {
    case 'ABSENT':
      return { color: '#B42318', background: '#FDECEC' };
    case 'LATE':
      return { color: '#B54708', background: '#FFF1DE' };
    case 'EXCUSED':
      return { color: '#175CD3', background: '#EAF2FF' };
    default:
      return { color: palette.accentStrong, background: palette.accentSoft };
  }
}

function SummaryCard({ label, value, tone, palette }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: tone.background, borderColor: palette.border }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: tone.color }]}>{value}</Text>
    </View>
  );
}

function FilterPill({ label, active, onPress, palette }) {
  return (
    <Pressable
      style={[
        styles.filterPill,
        {
          borderColor: active ? palette.accent : palette.border,
          backgroundColor: active ? palette.accentSoft : palette.surfaceRaised,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterPillText, { color: active ? palette.accentStrong : palette.textSoft }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ParentAttendanceScreen({ onBack, initialStudentId = null, embedded = false }) {
  const palette = getRolePalette('parent');
  const [range, setRange] = React.useState('1m');
  const [selectedStudentId, setSelectedStudentId] = React.useState(initialStudentId || '');
  const cachedAttendance = React.useMemo(
    () =>
      peekParentAttendance({
        range,
        studentId: selectedStudentId || null,
      }),
    [range, selectedStudentId]
  );

  React.useEffect(() => {
    setSelectedStudentId(initialStudentId || '');
  }, [initialStudentId]);

  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    React.useCallback(async () => {
      return getParentAttendance({
        range,
        studentId: selectedStudentId || null,
      });
    }, [range, selectedStudentId]),
    { initialData: cachedAttendance || null }
  );

  const summary = data?.summary || { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  const children = data?.children || [];
  const rows = data?.rows || [];
  const activeChild = children.find((child) => child.id === selectedStudentId) || null;

  if (isLoading && !data) return <LoadingState />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      {embedded ? null : (
        <View style={styles.topRow}>
          <Pressable
            style={[styles.backButton, { borderColor: palette.border, backgroundColor: palette.surfaceRaised }]}
            onPress={onBack}
          >
            <Feather name="arrow-left" size={18} color={palette.text} />
          </Pressable>
        </View>
      )}

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      <FeedHero
        title="Child Attendance"
        summary={
          activeChild
            ? `Focused on ${activeChild.displayName || 'your child'} across the selected range.`
            : 'Track lesson attendance for every linked child with fast filters and a cleaner family view.'
        }
        chips={[
          range.toUpperCase(),
          `${rows.length} records`,
          activeChild ? activeChild.displayName || 'Linked child' : `${children.length} linked children`,
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

      <FeedSection title="Filters" action={selectedStudentId ? 'Child selected' : 'All children'}>
        <View style={[styles.filterCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={styles.filterTitle}>Range</Text>
          <View style={styles.pillRow}>
            {RANGE_OPTIONS.map((option) => (
              <FilterPill
                key={option.key}
                label={option.label}
                active={range === option.key}
                onPress={() => setRange(option.key)}
                palette={palette}
              />
            ))}
          </View>

          <Text style={styles.filterTitle}>Child Filter</Text>
          <View style={styles.pillRow}>
            <FilterPill
              label="All linked children"
              active={!selectedStudentId}
              onPress={() => setSelectedStudentId('')}
              palette={palette}
            />
            {children.map((child) => (
              <FilterPill
                key={child.id}
                label={child.displayName || 'Student'}
                active={selectedStudentId === child.id}
                onPress={() => setSelectedStudentId(child.id)}
                palette={palette}
              />
            ))}
          </View>
        </View>
      </FeedSection>

      <FeedSection title="Attendance snapshot" action={`${summary.PRESENT + summary.ABSENT + summary.LATE + summary.EXCUSED} marks`}>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Present" value={summary.PRESENT || 0} tone={getStatusTone('PRESENT', palette)} palette={palette} />
          <SummaryCard label="Absent" value={summary.ABSENT || 0} tone={getStatusTone('ABSENT', palette)} palette={palette} />
          <SummaryCard label="Late" value={summary.LATE || 0} tone={getStatusTone('LATE', palette)} palette={palette} />
          <SummaryCard label="Excused" value={summary.EXCUSED || 0} tone={getStatusTone('EXCUSED', palette)} palette={palette} />
        </View>
      </FeedSection>

      <FeedSection title="Attendance timeline" action={rows.length ? 'Latest first' : ''}>
        {rows.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No attendance records"
            message="Attendance updates for your linked children will appear here once lessons have been marked."
            supportingTone="info"
          />
        ) : (
          rows.map((row) => {
            const tone = getStatusTone(row.status, palette);
            return (
              <FeedCard
                key={row.id}
                unread={String(row.status || '').toUpperCase() === 'ABSENT'}
                leading={<AttendanceBadge status={String(row.status || '').toLowerCase()} />}
                eyebrow={row.studentName || 'Student'}
                title={`${row.subjectName || 'Lesson'} • ${row.className || 'Class'}`}
                message={[
                  formatDate(row.date),
                  formatTimeLabel(row.startTime),
                  row.teacherName,
                  row.room ? `Room ${row.room}` : null,
                  row.remarks || null,
                ].filter(Boolean).join(' • ')}
                timestamp={String(row.status || '').toUpperCase()}
                accessory={
                  <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
                    <Text style={[styles.statusPillText, { color: tone.color }]}>
                      {String(row.status || 'present').toUpperCase()}
                    </Text>
                  </View>
                }
              />
            );
          })
        )}
      </FeedSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  filterCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  filterTitle: {
    color: '#102033',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  summaryLabel: {
    color: '#5B667A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: {
    marginTop: spacing.xs,
    fontSize: 28,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
