import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ContentDetailSheet } from '../../components/shared/ContentDetailSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { getAdminPeopleDirectory, getAdminPersonDetail } from '../../services/adminPeopleService';
import { colors, getRolePalette, radii, shadows, spacing } from '../../theme';

const ADMIN = getRolePalette('admin');

const FILTERS = [
  { key: 'student', label: 'Students' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'parent', label: 'Parents' },
];

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.filterChip, active ? styles.filterChipActive : null]}
    >
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function AdminPeopleScreen({ profile }) {
  const [activeRole, setActiveRole] = useState('student');
  const [selectedPersonDetail, setSelectedPersonDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoadingId, setDetailLoadingId] = useState('');
  const { data, error, isLoading, load } = useAsyncResource(
    useCallback(async () => getAdminPeopleDirectory(), []),
    { initialData: { groups: buildInitialGroups(), notice: '' } }
  );

  const filteredRows = useMemo(() => {
    const group = (data?.groups || []).find((item) => item.key === activeRole);
    return group?.items || [];
  }, [activeRole, data?.groups]);

  const handlePersonPress = useCallback(async (row) => {
    setDetailError('');
    setDetailLoadingId(row.id);

    try {
      const detail = await getAdminPersonDetail({ profileId: row.id });
      setSelectedPersonDetail(detail);
    } catch (detailLoadError) {
      setDetailError(detailLoadError?.message || 'Failed to load person details.');
    } finally {
      setDetailLoadingId('');
    }
  }, []);

  if (isLoading) return <LoadingState />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data?.errorMessage ? <ErrorBanner message={data.errorMessage} onRetry={load} /> : null}
        {!data?.errorMessage && error ? <ErrorBanner message={error} onRetry={load} /> : null}
        {detailError ? <ErrorBanner message={detailError} /> : null}
        {data?.notice ? <Text style={styles.notice}>{data.notice}</Text> : null}

        <View style={styles.heroCard}>
          <Text style={styles.title}>People</Text>
          <Text style={styles.subtitle}>
            {profile?.fullName || 'Admin'} can quickly inspect Students, Teachers, and Parents from
            mobile.
          </Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <FilterChip
              key={item.key}
              label={item.label}
              active={activeRole === item.key}
              onPress={() => setActiveRole(item.key)}
            />
          ))}
        </View>

        {filteredRows.length === 0 ? (
          <EmptyState
            icon="users"
            title="No people available"
            message={`No ${
              FILTERS.find((item) => item.key === activeRole)?.label?.toLowerCase() || 'records'
            } are available right now.`}
          />
        ) : (
          <View style={styles.list}>
            {filteredRows.map((row) => (
              <TouchableOpacity
                key={row.id}
                activeOpacity={0.88}
                onPress={() => handlePersonPress(row)}
                style={styles.personCard}
              >
                <View style={styles.personCopy}>
                  <Text style={styles.personName}>{row.fullName || row.email || 'Unnamed user'}</Text>
                  <Text style={styles.personMeta}>
                    {[row.summary, row.secondary].filter(Boolean).join(' | ') ||
                      row.email ||
                      'No details available'}
                  </Text>
                </View>
                <Text style={styles.personAction}>
                  {detailLoadingId === row.id ? 'Loading' : 'Open'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ContentDetailSheet
        visible={Boolean(selectedPersonDetail)}
        title={selectedPersonDetail?.title || 'Person'}
        eyebrow={selectedPersonDetail?.eyebrow || 'Person'}
        subtitle={selectedPersonDetail?.subtitle || ''}
        timestamp={selectedPersonDetail?.timestamp || ''}
        metadataItems={selectedPersonDetail?.metadataItems || []}
        sections={selectedPersonDetail?.sections || []}
        body={selectedPersonDetail?.body || ''}
        onClose={() => setSelectedPersonDetail(null)}
      />
    </>
  );
}

function buildInitialGroups() {
  return FILTERS.map((item) => ({
    key: item.key,
    label: item.label,
    items: [],
  }));
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
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
  notice: {
    color: ADMIN.accentStrong,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: ADMIN.accentStrong,
    backgroundColor: ADMIN.accentSoft,
  },
  filterChipLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipLabelActive: {
    color: ADMIN.accentStrong,
  },
  list: {
    gap: spacing.sm,
  },
  personCard: {
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
  personCopy: {
    flex: 1,
    gap: 4,
  },
  personName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  personMeta: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  personAction: {
    color: ADMIN.accentStrong,
    fontSize: 13,
    fontWeight: '800',
  },
});
