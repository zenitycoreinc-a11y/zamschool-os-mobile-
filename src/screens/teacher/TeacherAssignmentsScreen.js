import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { listTeacherAssignments } from '../../services/assignmentService';
import { formatDate } from '../../utils/date';
import { useAsyncResource } from '../../hooks/useAsyncResource';

export function TeacherAssignmentsScreen() {
  const { data: items, error, isLoading, load } = useAsyncResource(
    useCallback(async () => {
      const rows = await listTeacherAssignments(40);
      return rows || [];
    }, []),
    { initialData: [] }
  );

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      <Card title="Assignments">
        {items.length === 0 ? <EmptyState icon="file-text" title="No assignments" message="No assignments found for your classes." /> : null}
        {items.map((it) => (
          <View key={it.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{it.title || 'Untitled Assignment'}</Text>
              <Text style={styles.meta}>{it.className} • {it.subjectName}</Text>
              <Text style={styles.meta}>Due: {formatDate(it.dueDate)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 90 },
  row: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { color: '#111827', fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 12, marginTop: 2 },
});
