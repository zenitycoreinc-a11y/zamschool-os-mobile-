import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { getAdminRollCallMonitor } from '../../services/adminOperationsService';
import { colors, getRolePalette, radii, shadows, spacing } from '../../theme';

const ADMIN = getRolePalette('admin');

function SummaryPill({ label, value }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function DetailList({ title, rows, accentStyle }) {
  if (!rows.length) return null;

  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      <View style={styles.detailList}>
        {rows.map((row) => (
          <View key={`${title}-${row.id}`} style={styles.detailRow}>
            <View style={styles.detailCopy}>
              <Text style={styles.detailName}>{row.name}</Text>
              <Text style={styles.detailMeta}>{row.remarks || row.status}</Text>
            </View>
            <View style={[styles.detailStatusChip, accentStyle]}>
              <Text style={styles.detailStatusLabel}>{row.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AdminRollCallMonitorScreen() {
  const { data, error, isLoading, load } = useAsyncResource(
    async () => getAdminRollCallMonitor(),
    { initialData: buildInitialData() }
  );
  const classes = data?.classes || [];
  const [selectedClassId, setSelectedClassId] = useState('');

  const selectedClass = useMemo(() => {
    if (!classes.length) {
      return null;
    }

    if (selectedClassId) {
      return classes.find((item) => item.id === selectedClassId) || classes[0];
    }

    return classes[0];
  }, [classes, selectedClassId]);

  if (isLoading && classes.length === 0) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {data?.errorMessage ? <ErrorBanner message={data.errorMessage} onRetry={load} /> : null}
      {!data?.errorMessage && error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {data?.notice ? <Text style={styles.notice}>{data.notice}</Text> : null}

      <View style={styles.heroCard}>
        <Text style={styles.title}>Roll Call</Text>
        <Text style={styles.subtitle}>
          Missing morning roll calls, absentees, sick learners, and late arrivals by class.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <SummaryPill
          label="Missing morning roll calls"
          value={String(data?.summary?.missingMorningRollCalls || 0)}
        />
        <SummaryPill
          label="Unresolved roll calls"
          value={String(data?.summary?.unresolvedMorningRollCalls || 0)}
        />
        <SummaryPill label="Sick learners" value={String(data?.summary?.sickLearners || 0)} />
        <SummaryPill label="Late learners" value={String(data?.summary?.lateLearners || 0)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classes</Text>
        {classes.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No roll-call issues"
            message="Class attendance monitoring will appear here once morning roll call data is available."
          />
        ) : (
          classes.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => setSelectedClassId(item.id)}
              style={[styles.classCard, selectedClass?.id === item.id ? styles.classCardActive : null]}
            >
              <View style={styles.classCopy}>
                <Text style={styles.classTitle}>{item.name}</Text>
                <Text style={styles.classMeta}>
                  {item.unresolvedCount} unresolved, {item.sickCount} sick, {item.lateCount} late
                </Text>
              </View>
              <Text style={styles.classAction}>Open class</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {selectedClass ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedClass.name}</Text>
          <Text style={styles.detailSubtitle}>
            {selectedClass.unresolvedCount} unresolved, {selectedClass.sickCount} sick,{' '}
            {selectedClass.lateCount} late across {selectedClass.lessonCount} lesson
            {selectedClass.lessonCount === 1 ? '' : 's'}.
          </Text>

          <DetailList
            title="Absent learners"
            rows={selectedClass.absentStudents}
            accentStyle={styles.absentChip}
          />
          <DetailList
            title="Sick learners"
            rows={selectedClass.sickStudents}
            accentStyle={styles.sickChip}
          />
          <DetailList
            title="Late learners"
            rows={selectedClass.lateStudents}
            accentStyle={styles.lateChip}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function buildInitialData() {
  return {
    summary: {
      missingMorningRollCalls: 0,
      unresolvedMorningRollCalls: 0,
      sickLearners: 0,
      lateLearners: 0,
      presentLearners: 0,
    },
    classes: [],
    notice: '',
    errorMessage: '',
  };
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  notice: {
    color: ADMIN.accentStrong,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryPill: {
    width: '48%',
    minHeight: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadows.card,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    paddingHorizontal: spacing.xs,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  classCardActive: {
    borderColor: ADMIN.accentStrong,
    backgroundColor: ADMIN.accentSoft,
  },
  classCopy: {
    flex: 1,
    gap: 4,
  },
  classTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  classMeta: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  classAction: {
    color: ADMIN.accentStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  detailCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  detailSubtitle: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  detailSection: {
    gap: spacing.xs,
  },
  detailSectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailList: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  detailMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  detailStatusChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  detailStatusLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  absentChip: {
    backgroundColor: colors.dangerSoft || colors.surfaceMuted,
  },
  sickChip: {
    backgroundColor: colors.successSoft || colors.surfaceMuted,
  },
  lateChip: {
    backgroundColor: colors.warningSoft || colors.surfaceMuted,
  },
});
