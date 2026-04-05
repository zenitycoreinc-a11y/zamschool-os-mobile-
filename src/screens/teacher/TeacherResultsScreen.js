import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { listTeacherResults, peekTeacherResults, publishTeacherResults } from '../../services/teacherService';
import { colors } from '../../theme';

function buildAssignmentSummary(results = []) {
  const grouped = new Map();

  for (const row of results) {
    const assignmentId = row.assignmentId || row.id;
    const current = grouped.get(assignmentId) || {
      assignmentId,
      assignmentTitle: row.assignmentTitle || 'Assignment',
      className: row.className || 'Class',
      subjectName: row.subjectName || 'Subject',
      total: 0,
      draft: 0,
      published: 0,
      latestPublishedAt: row.publishedAt || null,
      rows: [],
    };

    current.total += 1;
    current.rows.push(row);
    if (row.publishStatus === 'published') {
      current.published += 1;
      current.latestPublishedAt = row.publishedAt || current.latestPublishedAt;
    } else {
      current.draft += 1;
    }

    grouped.set(assignmentId, current);
  }

  return Array.from(grouped.values());
}

export function TeacherResultsScreen() {
  const [message, setMessage] = useState('');
  const [publishingAssignmentId, setPublishingAssignmentId] = useState(null);
  const cachedRows = peekTeacherResults();

  const { data: rows, error, isLoading, load, loadOrThrow } = useAsyncResource(
    useCallback(async () => {
      const data = await listTeacherResults();
      return data || [];
    }, []),
    { initialData: cachedRows || null }
  );

  const safeRows = rows || [];
  const groupedAssignments = useMemo(() => buildAssignmentSummary(safeRows), [safeRows]);

  const { run: runPublish } = useAsyncAction(
    useCallback(
      async (assignmentId) => {
        await publishTeacherResults({ assignmentId });
      },
      []
    )
  );

  async function handlePublish(assignmentId) {
    setMessage('');
    setPublishingAssignmentId(assignmentId);

    try {
      await runPublish(assignmentId);
      await loadOrThrow();
      setMessage('Results published to linked students and parents.');
    } catch (publishError) {
      setMessage(publishError?.message || 'Failed to publish results.');
    } finally {
      setPublishingAssignmentId(null);
    }
  }

  if (isLoading && !rows) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {message ? (
        <Text style={[styles.message, message.includes('Failed') ? styles.errorText : styles.successText]}>
          {message}
        </Text>
      ) : null}

      <Card title="Results publishing">
        <Text style={styles.meta}>
          Draft results stay visible to teachers only. Publish when they are ready for linked students and parents.
        </Text>
      </Card>

      {groupedAssignments.length === 0 ? (
        <Card title="Published results">
          <EmptyState
            icon="bar-chart-2"
            title="No results yet"
            message="Results entered for your classes will appear here."
          />
        </Card>
      ) : null}

      {groupedAssignments.map((assignment) => {
        const canPublish = assignment.draft > 0;
        return (
          <Card key={assignment.assignmentId} title={assignment.assignmentTitle}>
            <Text style={styles.assignmentMeta}>
              {assignment.className} | {assignment.subjectName}
            </Text>
            <Text style={styles.assignmentMeta}>
              {assignment.published}/{assignment.total} published
              {assignment.draft > 0 ? ` | ${assignment.draft} draft` : ''}
            </Text>
            <Text style={styles.assignmentMeta}>
              {assignment.latestPublishedAt
                ? `Last published: ${formatShortDate(assignment.latestPublishedAt)}`
                : 'Not yet visible to parents/students'}
            </Text>

            <View style={styles.resultList}>
              {assignment.rows.map((row) => (
                <View key={row.id} style={styles.resultRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{row.studentName}</Text>
                    <Text style={styles.rowMeta}>
                      {row.score == null ? 'No score' : `${row.score}${row.maxMarks ? `/${row.maxMarks}` : ''}`}
                      {row.grade ? ` | Grade ${row.grade}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      row.publishStatus === 'published' ? styles.statusPublished : styles.statusDraft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        row.publishStatus === 'published' ? styles.statusTextPublished : styles.statusTextDraft,
                      ]}
                    >
                      {row.publishStatus === 'published' ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Button
              label={
                publishingAssignmentId === assignment.assignmentId
                  ? 'Publishing...'
                  : canPublish
                    ? 'Publish to parents and students'
                    : 'Already published'
              }
              onPress={() => handlePublish(assignment.assignmentId)}
              disabled={!canPublish || publishingAssignmentId === assignment.assignmentId}
            />
          </Card>
        );
      })}
    </ScrollView>
  );
}

function formatShortDate(value) {
  const parsed = Date.parse(String(value || ''));
  if (Number.isNaN(parsed)) return 'Unknown';
  return new Date(parsed).toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 90 },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: '#15803D',
  },
  errorText: {
    color: '#DC2626',
  },
  assignmentMeta: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  resultList: {
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentName: {
    color: colors.text,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusPublished: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextDraft: {
    color: '#B45309',
  },
  statusTextPublished: {
    color: '#166534',
  },
});
