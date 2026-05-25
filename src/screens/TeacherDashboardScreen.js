import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AvatarCircle } from '../components/shared/AvatarCircle';
import { AnnouncementCard } from '../components/ui/AnnouncementCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { listAnnouncements, peekAnnouncements } from '../services/announcementService';
import { getTeacherDashboardData, peekTeacherDashboardData } from '../services/teacherService.js';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { colors, getRolePalette, radii, shadows } from '../theme';

const TEACHER = getRolePalette('teacher');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function TeacherDashboardScreen({ profile, onNavigate }) {
  const isWeb = Platform.OS === 'web';
  const todayDate = getTodayDate();
  const cachedDashboard = peekTeacherDashboardData(todayDate);
  const cachedAnnouncements = peekAnnouncements(3);
  const cachedData =
    cachedDashboard || cachedAnnouncements
      ? {
          lessons: cachedDashboard?.lessons || [],
          summary: cachedDashboard?.summary || {
            lessonCount: 0,
            classCount: 0,
            studentCount: 0,
            nextLesson: null,
          },
          announcements: cachedAnnouncements || [],
        }
      : null;

  const { data, error, isLoading, refreshing, load, refresh } = useAsyncResource(
    React.useCallback(async () => {
      const [dashboard, announcements] = await Promise.all([
        getTeacherDashboardData(todayDate),
        listAnnouncements(3),
      ]);

      return {
        lessons: dashboard.lessons || [],
        summary: dashboard.summary || {
          lessonCount: 0,
          classCount: 0,
          studentCount: 0,
          nextLesson: null,
        },
        announcements: announcements || [],
      };
    }, []),
    {
      initialData: cachedData,
    }
  );

  const lessons = data?.lessons || [];
  const summary = data?.summary || {
    lessonCount: 0,
    classCount: 0,
    studentCount: 0,
    nextLesson: null,
  };
  const announcements = data?.announcements || [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const nextLesson = summary.nextLesson;

  if (isLoading && !data) return <LoadingState />;

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#1D2A4D', TEACHER.accentStrong, TEACHER.accent]}
        style={[styles.header, { paddingTop: isWeb ? 67 : 20, paddingBottom: 48 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>{profile?.fullName || 'Teacher'}</Text>
          </View>
          <AvatarCircle name={profile?.fullName || 'Teacher'} avatarUrl={null} size={40} color="#fff" />
        </View>
        <View style={styles.roleBadge}>
          <Feather name="book-open" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.roleText}>Teacher</Text>
        </View>
      </LinearGradient>

      {error ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <ErrorBanner message={error} onRetry={load} />
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard value={summary.classCount || 0} label="Classes Today" icon="book" color="#7C3AED" bg="#F5F3FF" />
        <StatCard value={summary.lessonCount || 0} label="Lessons Today" icon="clock" color="#1B3A6B" bg="#EFF6FF" />
        <StatCard value={summary.studentCount || 0} label="Students Today" icon="users" color="#065F46" bg="#ECFDF5" />
      </View>

      <View style={styles.section}>
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>
            {nextLesson ? `Next up: ${nextLesson.subjectName}` : 'No lessons scheduled today'}
          </Text>
          <Text style={styles.impactBody}>
            {nextLesson
              ? `${nextLesson.className} starts at ${nextLesson.startTime}. Rollcall is ready from the shared teacher attendance flow.`
              : 'When classes are assigned and timetables are published, your dashboard will show them here.'}
          </Text>
          <Text style={styles.impactMeta}>
            {nextLesson ? `${nextLesson.rosterCount || nextLesson.roster?.length || 0} students in the next roster` : '0 students scheduled right now'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={`${today}'s Schedule`}
          action="Open Attendance"
          onAction={() => onNavigate?.('attendance')}
        />
        {lessons.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No lessons today"
            message="Enjoy your free day"
            supportingTone="calm"
          />
        ) : (
          lessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{lesson.startTime || '--:--'}</Text>
                <Text style={styles.timeSep}>-</Text>
                <Text style={styles.timeText}>{lesson.endTime || '--:--'}</Text>
              </View>
              <View style={styles.lessonDivider} />
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonSubject}>{lesson.subjectName || 'Subject'}</Text>
                <Text style={styles.lessonClass}>{lesson.className || 'Class'}</Text>
                <Text style={styles.lessonRoom}>
                  {lesson.room ? `Room ${lesson.room}` : `${lesson.rosterCount || lesson.roster?.length || 0} students`}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickRow}>
        {[
          { icon: 'users', label: 'Attendance', color: '#7C3AED', bg: '#F5F3FF', route: 'attendance' },
          { icon: 'clipboard', label: 'Classroom', color: '#2563EB', bg: '#DBEAFE', route: 'classroom' },
          { icon: 'file-text', label: 'Assignments', color: '#1B3A6B', bg: '#EFF6FF', route: 'assignments' },
          { icon: 'message-circle', label: 'Messages', color: '#92400E', bg: '#FFFBEB', route: 'messages' },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={() => onNavigate?.(item.route)}
            style={({ pressed }) => [styles.quickCard, pressed ? { opacity: 0.75 } : null]}
          >
            <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
              <Feather name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, { paddingBottom: isWeb ? 34 : 80 }]}>
        <SectionHeader
          title="Announcements"
          action="See All"
          onAction={() => onNavigate?.('announcements')}
        />
        {announcements.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No announcements"
            message="No notices at the moment."
            supportingTone="info"
          />
        ) : (
          announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TEACHER.bg },
  header: { paddingHorizontal: 20, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.75)' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  roleText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginTop: -24,
  },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  impactCard: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 18,
    gap: 8,
    ...shadows.card,
  },
  impactTitle: {
    color: TEACHER.accentStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  impactBody: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  impactMeta: {
    color: TEACHER.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...shadows.card,
  },
  timeCol: { alignItems: 'center', minWidth: 52 },
  timeText: { fontSize: 12, fontWeight: '700', color: colors.textSoft },
  timeSep: { fontSize: 11, color: colors.mutedSoft },
  lessonDivider: { width: 2, height: 40, backgroundColor: TEACHER.accent, borderRadius: 2 },
  lessonInfo: { flex: 1, gap: 2 },
  lessonSubject: { fontSize: 14, fontWeight: '800', color: colors.text },
  lessonClass: { fontSize: 13, fontWeight: '600', color: colors.textSoft },
  lessonRoom: { fontSize: 12, fontWeight: '600', color: colors.muted },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    gap: 8,
    ...shadows.card,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.textSoft },
});
