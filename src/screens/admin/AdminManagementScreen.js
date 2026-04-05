import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { SegmentedControl } from '../../components/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import {
  assignClassSupervisor,
  assignStudentClass,
  createAdminClass,
  getAdminManagementDirectory,
  linkParentStudent,
  unlinkParentStudent,
} from '../../services/adminManagementService';
import { colors, radii, shadows, spacing } from '../../theme';

const modeOptions = [
  { value: 'classes', label: 'Classes' },
  { value: 'students', label: 'Student Links' },
  { value: 'parents', label: 'Parent Links' },
];

function SelectableChip({ label, meta, active, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[styles.selectionChip, active ? styles.selectionChipActive : null]}>
      <Text style={[styles.selectionLabel, active ? styles.selectionLabelActive : null]}>{label}</Text>
      {meta ? <Text style={[styles.selectionMeta, active ? styles.selectionMetaActive : null]}>{meta}</Text> : null}
    </TouchableOpacity>
  );
}

export function AdminManagementScreen({ profile }) {
  const [mode, setMode] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedTeacherProfileId, setSelectedTeacherProfileId] = useState(null);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState(null);
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(null);
  const [selectedParentProfileId, setSelectedParentProfileId] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [message, setMessage] = useState('');

  const loader = useCallback(async () => {
    const directory = await getAdminManagementDirectory();
    return directory || { students: [], teachers: [], parents: [], classes: [] };
  }, []);

  const { data, error, isLoading, load } = useAsyncResource(loader, {
    initialData: { students: [], teachers: [], parents: [], classes: [] },
  });

  const selectedParent = useMemo(
    () => (data.parents || []).find((item) => item.profileId === selectedParentProfileId) || null,
    [data.parents, selectedParentProfileId]
  );

  const selectedStudent = useMemo(
    () => (data.students || []).find((item) => item.profileId === selectedStudentProfileId) || null,
    [data.students, selectedStudentProfileId]
  );

  const { run: runCreateClass, isRunning: creatingClass } = useAsyncAction(
    useCallback(async () => {
      if (!newClassName.trim()) {
        throw new Error('Class name is required.');
      }
      await createAdminClass({ name: newClassName.trim() });
    }, [newClassName])
  );

  const { run: runAssignSupervisor, isRunning: assigningSupervisor } = useAsyncAction(
    useCallback(async () => {
      if (!selectedClassId) {
        throw new Error('Select a class first.');
      }
      await assignClassSupervisor({
        classId: selectedClassId,
        supervisorId: selectedTeacherProfileId || null,
      });
    }, [selectedClassId, selectedTeacherProfileId])
  );

  const { run: runAssignStudentClass, isRunning: assigningStudentClass } = useAsyncAction(
    useCallback(async () => {
      if (!selectedStudentProfileId) {
        throw new Error('Select a student first.');
      }
      await assignStudentClass({
        studentProfileId: selectedStudentProfileId,
        classId: selectedStudentClassId || null,
      });
    }, [selectedStudentClassId, selectedStudentProfileId])
  );

  const { run: runToggleParentLink, isRunning: linkingParentStudent } = useAsyncAction(
    useCallback(
      async (studentProfileId, shouldLink) => {
        if (!selectedParentProfileId) {
          throw new Error('Select a parent first.');
        }

        if (shouldLink) {
          await linkParentStudent({
            parentProfileId: selectedParentProfileId,
            studentProfileId,
          });
          return;
        }

        await unlinkParentStudent({
          parentProfileId: selectedParentProfileId,
          studentProfileId,
        });
      },
      [selectedParentProfileId]
    )
  );

  async function runMutation(task, successMessage) {
    setMessage('');
    try {
      await task();
      setMessage(successMessage);
      if (successMessage === 'Class created.') {
        setNewClassName('');
      }
      await load();
    } catch (mutationError) {
      setMessage(mutationError.message || 'Update failed.');
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {message ? <Text style={[styles.message, message.includes('failed') || message.includes('required') ? styles.error : null]}>{message}</Text> : null}

      <Card title="Relationship Manager">
        <Text style={styles.summary}>
          {profile?.fullName || 'Admin'} can manage classes, assign students to classes, and link parents to students from mobile.
        </Text>
        <SegmentedControl options={modeOptions} selected={mode} onSelect={setMode} />
      </Card>

      {mode === 'classes' ? (
        <>
          <Card title="Create class">
            <Input
              label="Class name"
              value={newClassName}
              onChangeText={setNewClassName}
              placeholder="Grade 7 A"
            />
            <Button
              label={creatingClass ? 'Creating...' : 'Create class'}
              onPress={() => runMutation(runCreateClass, 'Class created.')}
              disabled={creatingClass}
            />
          </Card>

          <Card title="Assign class supervisor">
            {(data.classes || []).length === 0 ? (
              <EmptyState icon="book" title="No classes yet" message="Create a class first." />
            ) : (
              <View style={styles.selectionList}>
                {(data.classes || []).map((item) => (
                  <SelectableChip
                    key={item.id}
                    label={item.name}
                    meta={item.supervisorName || item.gradeLabel || 'No supervisor'}
                    active={selectedClassId === item.id}
                    onPress={() => setSelectedClassId(item.id)}
                  />
                ))}
              </View>
            )}

            <Text style={styles.sectionLabel}>Teachers</Text>
            {(data.teachers || []).length === 0 ? (
              <EmptyState icon="users" title="No teachers" message="Teacher records will appear here." />
            ) : (
              <View style={styles.selectionList}>
                {(data.teachers || []).map((item) => (
                  <SelectableChip
                    key={item.profileId}
                    label={item.displayName}
                    meta={item.employeeId || item.email || 'Teacher'}
                    active={selectedTeacherProfileId === item.profileId}
                    onPress={() =>
                      setSelectedTeacherProfileId((current) => (current === item.profileId ? null : item.profileId))
                    }
                  />
                ))}
              </View>
            )}

            <Button
              label={assigningSupervisor ? 'Saving...' : 'Assign supervisor'}
              onPress={() => runMutation(runAssignSupervisor, 'Class supervisor updated.')}
              disabled={!selectedClassId || assigningSupervisor}
            />
          </Card>
        </>
      ) : null}

      {mode === 'students' ? (
        <>
          <Card title="Select student">
            {(data.students || []).length === 0 ? (
              <EmptyState icon="user" title="No students" message="Student records will appear here." />
            ) : (
              <View style={styles.selectionList}>
                {(data.students || []).map((item) => (
                  <SelectableChip
                    key={item.profileId}
                    label={item.displayName}
                    meta={`${item.admissionNumber || 'No admission'} • ${item.className || 'Unassigned class'}`}
                    active={selectedStudentProfileId === item.profileId}
                    onPress={() => {
                      setSelectedStudentProfileId(item.profileId);
                      setSelectedStudentClassId(item.classId || null);
                    }}
                  />
                ))}
              </View>
            )}
          </Card>

          <Card title="Assign class">
            <Text style={styles.summary}>
              {selectedStudent
                ? `Assign ${selectedStudent.displayName} to a class or clear the assignment.`
                : 'Select a student first.'}
            </Text>
            <View style={styles.selectionList}>
              {(data.classes || []).map((item) => (
                <SelectableChip
                  key={item.id}
                  label={item.name}
                  meta={item.gradeLabel || 'Class'}
                  active={selectedStudentClassId === item.id}
                  onPress={() => setSelectedStudentClassId(item.id)}
                />
              ))}
              <SelectableChip
                label="Clear class"
                meta="Remove assignment"
                active={selectedStudentClassId === null}
                onPress={() => setSelectedStudentClassId(null)}
              />
            </View>

            <Button
              label={assigningStudentClass ? 'Saving...' : 'Save class assignment'}
              onPress={() => runMutation(runAssignStudentClass, 'Student class updated.')}
              disabled={!selectedStudentProfileId || assigningStudentClass}
            />
          </Card>
        </>
      ) : null}

      {mode === 'parents' ? (
        <>
          <Card title="Select parent">
            {(data.parents || []).length === 0 ? (
              <EmptyState icon="users" title="No parents" message="Parent records will appear here." />
            ) : (
              <View style={styles.selectionList}>
                {(data.parents || []).map((item) => (
                  <SelectableChip
                    key={item.profileId}
                    label={item.displayName}
                    meta={`${item.linkedStudentProfileIds?.length || 0} linked students`}
                    active={selectedParentProfileId === item.profileId}
                    onPress={() => setSelectedParentProfileId(item.profileId)}
                  />
                ))}
              </View>
            )}
          </Card>

          <Card title="Link students">
            <Text style={styles.summary}>
              {selectedParent
                ? `Tap a student to link or unlink them from ${selectedParent.displayName}.`
                : 'Select a parent first.'}
            </Text>
            {(data.students || []).length === 0 ? (
              <EmptyState icon="user" title="No students" message="Student records will appear here." />
            ) : (
              <View style={styles.selectionList}>
                {(data.students || []).map((student) => {
                  const linked = Boolean(selectedParent?.linkedStudentProfileIds?.includes(student.profileId));
                  return (
                    <TouchableOpacity
                      key={student.profileId}
                      activeOpacity={0.88}
                      style={[styles.linkRow, linked ? styles.linkRowActive : null]}
                      onPress={() =>
                        runMutation(
                          () => runToggleParentLink(student.profileId, !linked),
                          linked ? 'Parent link removed.' : 'Parent link saved.'
                        )
                      }
                      disabled={!selectedParentProfileId || linkingParentStudent}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.linkTitle, linked ? styles.linkTitleActive : null]}>{student.displayName}</Text>
                        <Text style={[styles.linkMeta, linked ? styles.linkMetaActive : null]}>
                          {student.admissionNumber || 'No admission'} • {student.className || 'Unassigned class'}
                        </Text>
                      </View>
                      <Text style={[styles.linkAction, linked ? styles.linkActionActive : null]}>
                        {linked ? 'Unlink' : 'Link'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  summary: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    color: colors.successStrong,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
  selectionList: {
    gap: spacing.sm,
  },
  selectionChip: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
    ...shadows.card,
  },
  selectionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  selectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  selectionLabelActive: {
    color: colors.primaryStrong,
  },
  selectionMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  selectionMetaActive: {
    color: colors.primaryStrong,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  linkRowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  linkTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  linkTitleActive: {
    color: colors.primaryStrong,
  },
  linkMeta: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  linkMetaActive: {
    color: colors.primaryStrong,
  },
  linkAction: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  linkActionActive: {
    color: colors.primaryStrong,
  },
});
