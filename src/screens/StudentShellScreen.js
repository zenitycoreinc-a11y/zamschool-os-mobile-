import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumShell } from '../components/shared/PremiumShell';
import { ContentDetailSheet } from '../components/shared/ContentDetailSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { LoadingState } from '../components/ui/LoadingState';
import { StudentAnnouncementsScreen } from './student/StudentAnnouncementsScreen';
import { StudentAttendanceScreen } from './student/StudentAttendanceScreen';
import { StudentMessagesScreen } from './student/StudentMessagesScreen';
import { StudentNotificationsScreen } from './student/StudentNotificationsScreen';
import { StudentProfileScreen } from './student/StudentProfileScreen';
import { studentBottomTabs, studentDrawerItems } from './student/navigationConfig.js';
import { splitMetricCardProps } from './student/metricCardProps';
import { CACHED_STUDENT_TABS, getMountedStudentTabs, rememberStudentTab } from './student/studentTabMounting.js';
import { signOut } from '../services/authService';
import {
  getStudentLibraryItems,
  getStudentResultsSummary,
  peekStudentResultsSummary,
} from '../services/studentService';
import {
  buildStudentDashboardViewModel,
  getStudentDashboard,
  peekStudentDashboard,
} from '../services/studentDashboardService.js';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { formatDate } from '../utils/date';
import { colors, getRolePalette, radii, shadows, spacing } from '../theme';
import { useDashboardTheme } from '../dashboardTheme';

const STUDENT = getRolePalette('student');
const CONTENT_BOTTOM_PADDING = spacing.xl + 40;
const ROUTE_TO_TAB = {
  home: 'home',
  profile: 'profile',
  attendance: 'attendance',
  attend: 'attendance',
  results: 'results',
  messages: 'messages',
  inbox: 'messages',
  schedule: 'schedule',
  timetable: 'schedule',
  assignments: 'assignments',
  tasks: 'assignments',
  library: 'library',
  materials: 'library',
  announcements: 'announcements',
  updates: 'announcements',
  notifications: 'notifications',
  alerts: 'notifications',
};

// Memoized Components for Performance
const MemoizedSectionCard = memo(({ title, subtitle, actionLabel, onAction, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity activeOpacity={0.88} onPress={onAction} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    {children}
  </View>
));

const MemoizedMetricCard = memo(({ title, value, note, icon, accentColor, tintColor, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.metricCard, { backgroundColor: tintColor }]}
    onPress={onPress}
  >
    <View style={[styles.metricIconWrap, { backgroundColor: accentColor }]}> 
      <Ionicons name={icon} size={18} color={colors.textInverse} />
    </View>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{String(value)}</Text>
    <Text style={styles.metricNote}>{note}</Text>
  </TouchableOpacity>
));

const MemoizedTimelineCard = memo(({ title, meta, submeta, statusLabel, icon, accentColor, iconColor, onPress }) => (
  <TouchableOpacity activeOpacity={0.88} style={styles.timelineCard} onPress={onPress}>
    <View style={[styles.timelineIconWrap, { backgroundColor: accentColor }]}>
      <Ionicons name={icon} size={16} color={iconColor || colors.textInverse} />
    </View>
    <View style={styles.timelineCopy}>
      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>
      <Text style={styles.rowMeta} numberOfLines={1}>{submeta}</Text>
    </View>
    <View style={styles.rowStatus}>
      <Text style={styles.rowStatusText}>{statusLabel}</Text>
    </View>
  </TouchableOpacity>
));

// Optimized Dashboard Screen
const HomeDashboard = memo(({
  dashboard,
  dashboardError,
  dashboardLoading,
  dashboardRefreshing,
  reloadDashboard,
  refreshDashboard,
  onNavigate,
  onSelectAssignment,
}) => {
  if (dashboardLoading && !dashboard) return <LoadingState />;

  const currentDashboard = useMemo(() => dashboard || buildStudentDashboardViewModel({}), [dashboard]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={dashboardRefreshing} onRefresh={refreshDashboard} tintColor={colors.primary} />
      }
    >
      {dashboardError ? <ErrorBanner message={dashboardError} onRetry={reloadDashboard} /> : null}

      <View style={styles.heroSection}>
        <LinearGradient colors={[STUDENT.accent, STUDENT.accentStrong]} style={styles.heroGradient}>
          <Text style={styles.heroGreeting}>Welcome back,</Text>
          <Text style={styles.heroName}>{currentDashboard.profile.displayName}</Text>
          <Text style={styles.heroClass}>{currentDashboard.profile.classLabel}</Text>
        </LinearGradient>
      </View>

      <View style={styles.metricRow}>
        <MemoizedMetricCard
          title="Attendance"
          value={currentDashboard.metrics.attendance.value}
          note={currentDashboard.metrics.attendance.note}
          icon="checkmark-circle-outline"
          accentColor={colors.successStrong}
          tintColor={colors.successSoft}
          onPress={() => onNavigate('attendance')}
        />
        <MemoizedMetricCard
          title="Assignments"
          value={currentDashboard.metrics.assignments.value}
          note={currentDashboard.metrics.assignments.note}
          icon="document-text-outline"
          accentColor={STUDENT.accentStrong}
          tintColor={STUDENT.accentSoft}
          onPress={() => onNavigate('assignments')}
        />
      </View>

      <MemoizedSectionCard title="Today's Lessons" actionLabel="View All" onAction={() => onNavigate('schedule')}>
        {currentDashboard.todayLessons.length === 0 ? (
          <EmptyState icon="calendar" title="No lessons today" message="Enjoy your free time!" />
        ) : (
          currentDashboard.todayLessons.map(lesson => (
            <MemoizedTimelineCard
              key={lesson.id}
              title={lesson.subjectName}
              meta={lesson.timeLabel}
              submeta={`${lesson.teacherName} • ${lesson.room}`}
              statusLabel={lesson.isCurrent ? 'Now' : 'Upcoming'}
              icon="time-outline"
              accentColor={lesson.isCurrent ? STUDENT.accent : STUDENT.accentSoft}
              onPress={() => onNavigate('schedule')}
            />
          ))
        )}
      </MemoizedSectionCard>
    </ScrollView>
  );
});

export function StudentShellScreen({ profile, onSignedOut }) {
  const { theme } = useDashboardTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [visitedTabs, setVisitedTabs] = useState(['home']);
  const [profileOverrides, setProfileOverrides] = useState({});

  const cachedDashboard = peekStudentDashboard();
  const {
    data: dashboard,
    error: dashboardError,
    isLoading: dashboardLoading,
    load: reloadDashboard,
    refresh: refreshDashboard,
    refreshing: dashboardRefreshing,
  } = useAsyncResource(useCallback(async () => getStudentDashboard(), []), {
    initialData: cachedDashboard || null,
  });

  const navigateTo = useCallback((route) => {
    const nextTab = ROUTE_TO_TAB[route];
    if (nextTab) {
      setActiveTab(nextTab);
      setVisitedTabs(prev => prev.includes(nextTab) ? prev : [...prev, nextTab]);
    }
  }, []);

  const shellProfile = useMemo(() => ({
    fullName: profileOverrides.fullName ?? dashboard?.profile?.displayName ?? profile?.fullName ?? 'Student',
    email: profileOverrides.email ?? dashboard?.profile?.email ?? profile?.email ?? null,
    avatarUrl: profileOverrides.avatarUrl ?? profile?.avatarUrl ?? null,
  }), [profileOverrides, dashboard, profile]);

  const renderTab = (tab) => {
    switch (tab) {
      case 'home':
        return (
          <HomeDashboard
            dashboard={dashboard}
            dashboardError={dashboardError}
            dashboardLoading={dashboardLoading}
            dashboardRefreshing={dashboardRefreshing}
            reloadDashboard={reloadDashboard}
            refreshDashboard={refreshDashboard}
            onNavigate={navigateTo}
          />
        );
      case 'profile':
        return <StudentProfileScreen profile={shellProfile} onSignedOut={onSignedOut} />;
      case 'attendance':
        return <StudentAttendanceScreen />;
      case 'announcements':
        return <StudentAnnouncementsScreen />;
      default:
        return <LoadingState />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <PremiumShell
        role="student"
        profile={shellProfile}
        title={shellProfile.fullName}
        items={studentDrawerItems}
        activeKey={activeTab}
        onSelect={navigateTo}
        onSignOut={onSignedOut}
        bottomTabs={studentBottomTabs}
      >
        <View style={styles.tabContent}>
          {visitedTabs.map(tab => (
            <View key={tab} style={[styles.tabPane, { display: activeTab === tab ? 'flex' : 'none' }]}>
              {renderTab(tab)}
            </View>
          ))}
        </View>
      </PremiumShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: STUDENT.bg },
  tabContent: { flex: 1 },
  tabPane: { flex: 1 },
  content: { paddingBottom: CONTENT_BOTTOM_PADDING },
  heroSection: { padding: spacing.lg },
  heroGradient: { padding: spacing.xl, borderRadius: radii.xl, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  heroGreeting: { color: colors.textInverse, opacity: 0.8, fontSize: 14 },
  heroName: { color: colors.textInverse, fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  heroClass: { color: colors.textInverse, opacity: 0.9, marginTop: 4 },
  metricRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  metricCard: { flex: 1, padding: spacing.lg, borderRadius: radii.lg },
  metricIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  sectionCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  sectionAction: { padding: 4 },
  sectionActionText: { color: STUDENT.accent, fontWeight: '600' },
  timelineCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md, marginBottom: spacing.sm },
  timelineIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  timelineCopy: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rowStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: STUDENT.bg },
  rowStatusText: { fontSize: 11, color: STUDENT.accent, fontWeight: 'bold' },
});
