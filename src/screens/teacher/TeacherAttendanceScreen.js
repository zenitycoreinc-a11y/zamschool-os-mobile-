import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { SegmentedControl } from '../../components/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { FeedCard, FeedCardIcon } from '../../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../../components/ui/FeedHero';
import { FeedSection } from '../../components/ui/FeedSection';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { formatLocalDateInputValue } from '../../services/dateUtils';
import { listTeacherLessons, saveTeacherAttendance } from '../../services/teacherService';
import { getRolePalette, radii, shadows, spacing } from '../../theme';

const attendanceOptions = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'EXCUSED', label: 'Excused' },
];

export function TeacherAttendanceScreen() {
  const palette = getRolePalette('teacher');
  const [date, setDate] = useState(formatLocalDateInputValue());
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [search, setSearch] = useState('');
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [remarksByStudent, setRemarksByStudent] = useState({});
  const [message, setMessage] = useState('');

  const loader = useCallback(async () => {
    const rows = await listTeacherLessons(date);
    return rows || [];
  }, [date]);

  const { data: lessons, error, isLoading, load, loadOrThrow } = useAsyncResource(loader, {
    initialData: [],
  });

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0] || null,
    [lessons, selectedLessonId]
  );

  const filteredRoster = useMemo(() => {
    if (!selectedLesson) return [];
    const term = search.trim().toLowerCase();
    if (!term) return selectedLesson.roster;

    return selectedLesson.roster.filter((student) =>
      `${student.displayName} ${student.admissionNumber || ''} ${student.email || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [search, selectedLesson]);

  const selectedStatuses = useMemo(
    () => Object.values(attendanceByStudent).filter(Boolean).length,
    [attendanceByStudent]
  );
  const isComplete = Boolean(selectedLesson) && selectedStatuses >= (selectedLesson?.rosterCount || 0);

  useEffect(() => {
    if (!lessons.length) {
      setSelectedLessonId(null);
      return;
    }

    setSelectedLessonId((current) =>
      lessons.find((lesson) => lesson.id === current)?.id || lessons[0].id
    );
  }, [lessons]);

  useEffect(() => {
    if (!selectedLesson) {
      setAttendanceByStudent({});
      setRemarksByStudent({});
      return;
    }

    setAttendanceByStudent(
      Object.fromEntries(
        selectedLesson.roster
          .filter((student) => student.status)
          .map((student) => [student.id, student.status])
      )
    );
    setRemarksByStudent(
      Object.fromEntries(
        selectedLesson.roster.map((student) => [student.id, student.remarks || ''])
      )
    );
  }, [selectedLesson]);

  const { run: runSaveAttendance, isRunning: savingAttendance } = useAsyncAction(
    useCallback(async () => {
      if (!selectedLesson) {
        throw new Error('Select a lesson before saving.');
      }

      const statuses = selectedLesson.roster.map((student) => {
        const status = attendanceByStudent[student.id];
        if (!status) {
          throw new Error('Attendance is incomplete. Mark every student before saving.');
        }

        return {
          studentId: student.id,
          status,
          remarks: String(remarksByStudent[student.id] || '').trim() || null,
        };
      });

      await saveTeacherAttendance({
        lessonId: selectedLesson.id,
        date,
        statuses,
      });
    }, [attendanceByStudent, date, remarksByStudent, selectedLesson])
  );

  async function handleSaveAttendance() {
    setMessage('');
    try {
      await runSaveAttendance();
      await loadOrThrow();
      setMessage('Attendance saved.');
    } catch (saveError) {
      setMessage(saveError.message || 'Attendance save failed.');
    }
  }

  function updateAttendance(studentId, status) {
    setAttendanceByStudent((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  function updateRemark(studentId, value) {
    setRemarksByStudent((current) => ({
      ...current,
      [studentId]: value,
    }));
  }

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {message ? (
        <ErrorBanner message={message} onRetry={message.includes('failed') ? handleSaveAttendance : undefined} />
      ) : null}

      <FeedHero
        title="Attendance"
        summary={
          selectedLesson
            ? `Mark attendance for ${selectedLesson.subjectName} in ${selectedLesson.className} and keep the class record current.`
            : 'Select one of your assigned lessons and mark attendance for every student.'
        }
        chips={[
          date,
          selectedLesson ? `${selectedStatuses}/${selectedLesson.rosterCount} marked` : 'No lesson selected',
          savingAttendance ? 'Saving in progress' : 'Teacher roll call',
        ]}
        accent={palette.accentStrong}
        accentSoft={palette.accentSoft}
        meta={
          <FeedHeroAction
            label="Reload lessons"
            onPress={load}
            icon="rotate-cw"
            accent={palette.accentStrong}
            accentSoft={palette.accentSoft}
          />
        }
      />

      <FeedSection title="Roll call date" action="Local date">
        <View style={[styles.panelCard, { borderColor: palette.border, backgroundColor: palette.surfaceRaised }]}>
          <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-03-24" />
        </View>
      </FeedSection>

      <FeedSection title="Assigned lessons" action={lessons.length ? `${lessons.length} total` : 'No lessons'}>
        {lessons.length === 0 ? (
          <EmptyState icon="users" title="No lessons" message="No assigned lessons are ready for roll call." />
        ) : (
          lessons.map((lesson) => {
            const markedCount = lesson.roster.filter((student) => Boolean(student.status)).length;
            const active = lesson.id === selectedLesson?.id;
            return (
              <FeedCard
                key={lesson.id}
                onPress={() => setSelectedLessonId(lesson.id)}
                leading={<FeedCardIcon icon="book-open" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
                eyebrow={active ? 'Selected lesson' : 'Assigned lesson'}
                title={`${lesson.subjectName} • ${lesson.className}`}
                message={`${markedCount}/${lesson.rosterCount} marked • ${formatTimeRange(lesson.startTime, lesson.endTime)}`}
                timestamp={active ? 'Ready to mark' : 'Tap to open'}
                unread={active}
              />
            );
          })
        )}
      </FeedSection>

      {selectedLesson ? (
        <FeedSection title="Lesson roster" action={`${filteredRoster.length} visible`}>
          <FeedCard
            leading={<FeedCardIcon icon="clipboard" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
            eyebrow="Selected lesson"
            title={`${selectedLesson.subjectName} • ${selectedLesson.className}`}
            message={`Marked ${selectedStatuses} of ${selectedLesson.rosterCount} • ${formatTimeRange(selectedLesson.startTime, selectedLesson.endTime)}`}
            timestamp={isComplete ? 'Ready to save' : 'Pending marks'}
          />

          <View style={[styles.panelCard, { borderColor: palette.border, backgroundColor: palette.surfaceRaised }]}>
            <Input
              label="Search students"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or admission number"
            />
          </View>

          {filteredRoster.length === 0 ? (
            <EmptyState icon="search" title="No matches" message="Adjust the roster search and try again." />
          ) : (
            filteredRoster.map((student) => (
              <View
                key={student.id}
                style={[styles.studentEditorCard, { borderColor: palette.border, backgroundColor: palette.surfaceRaised }]}
              >
                <Text style={styles.studentName}>{student.displayName}</Text>
                <Text style={styles.studentMeta}>
                  {student.admissionNumber || 'No admission number'}
                  {student.email ? ` • ${student.email}` : ''}
                </Text>
                <SegmentedControl
                  options={attendanceOptions}
                  selected={attendanceByStudent[student.id] || ''}
                  onSelect={(value) => updateAttendance(student.id, value)}
                />
                <Input
                  label="Remarks"
                  value={remarksByStudent[student.id] || ''}
                  onChangeText={(value) => updateRemark(student.id, value)}
                  placeholder="Optional note"
                />
              </View>
            ))
          )}

          <Button
            label={savingAttendance ? 'Saving...' : 'Save attendance'}
            onPress={handleSaveAttendance}
            disabled={!isComplete || savingAttendance}
          />
        </FeedSection>
      ) : null}
    </ScrollView>
  );
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return 'Time not set';
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || 'Time not set';
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  panelCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  studentEditorCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  studentName: {
    color: '#102033',
    fontSize: 15,
    fontWeight: '800',
  },
  studentMeta: {
    color: '#5B667A',
    fontSize: 12,
    fontWeight: '700',
  },
});
