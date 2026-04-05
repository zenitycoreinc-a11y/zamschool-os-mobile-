import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { signOut } from '../services/authService';
import { listTeacherLessons } from '../services/teacherService';
import { colors } from '../theme';
import { useAsyncResource } from '../hooks/useAsyncResource';

export function TeacherOpsScreen({ profile, onSignedOut }) {
  const [date, setDate] = useState(todayIsoDate());

  const loader = useCallback(async () => {
    const lessons = await listTeacherLessons(date);
    return lessons || [];
  }, [date]);

  const { data: lessons, error, isLoading, load } = useAsyncResource(loader, {
    initialData: [],
  });

  const overview = useMemo(() => {
    const uniqueStudents = new Set();
    let completed = 0;

    for (const lesson of lessons) {
      lesson.roster.forEach((student) => uniqueStudents.add(student.id));
      if (lesson.rosterCount > 0 && lesson.roster.every((student) => Boolean(student.status))) {
        completed += 1;
      }
    }

    return {
      lessons: lessons.length,
      students: uniqueStudents.size,
      completed,
      pending: Math.max(lessons.length - completed, 0),
    };
  }, [lessons]);

  async function handleSignOut() {
    await signOut();
    onSignedOut?.();
  }

  return (
    <AppLayout
      title="Classroom"
      subtitle={`${profile?.fullName || 'Teacher'} • Lesson overview`}
      rightSlot={<Button label="Sign out" variant="secondary" onPress={handleSignOut} />}
    >
      <Card title="Lesson date">
        <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-03-18" />
        <Button label="Refresh lessons" variant="secondary" onPress={load} disabled={isLoading} />
      </Card>

      <Card title="Rollcall overview">
        <Text style={styles.meta}>Assigned lessons: {overview.lessons}</Text>
        <Text style={styles.meta}>Students covered: {overview.students}</Text>
        <Text style={styles.meta}>Completed lessons: {overview.completed}</Text>
        <Text style={styles.meta}>Pending lessons: {overview.pending}</Text>
      </Card>

      <Card title="Assigned lessons">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {lessons.length === 0 ? (
          <Text style={styles.meta}>
            {isLoading ? 'Loading lessons...' : 'No lessons are assigned for this date.'}
          </Text>
        ) : (
          lessons.map((lesson) => {
            const markedCount = lesson.roster.filter((student) => Boolean(student.status)).length;
            return (
              <View key={lesson.id} style={styles.lessonRow}>
                <Text style={styles.lessonTitle}>{lesson.subjectName}</Text>
                <Text style={styles.lessonMeta}>{lesson.className}</Text>
                <Text style={styles.lessonMeta}>
                  {formatTimeRange(lesson.startTime, lesson.endTime)} • {markedCount}/{lesson.rosterCount} marked
                </Text>
              </View>
            );
          })
        )}
      </Card>

      <Card title="Attendance workflow">
        <Text style={styles.meta}>
          Use the Attendance tab to mark rollcall. Mobile now reads lessons from the shared web teacher attendance APIs instead of writing directly to the old class-subject tables.
        </Text>
      </Card>
    </AppLayout>
  );
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return 'Time not set';
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || 'Time not set';
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  error: {
    color: '#F87171',
    fontSize: 13,
  },
  lessonRow: {
    gap: 4,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A69',
  },
  lessonTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  lessonMeta: {
    color: colors.muted,
    fontSize: 12,
  },
});
