import React, { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { PremiumShell } from '../components/shared/PremiumShell';
import { signOut } from '../services/authService';
import { TeacherDashboardScreen } from './TeacherDashboardScreen';
import { TeacherOpsScreen } from './TeacherOpsScreen';
import { TeacherAttendanceScreen } from './teacher/TeacherAttendanceScreen';
import { TeacherAssignmentsScreen } from './teacher/TeacherAssignmentsScreen';
import { TeacherMessagesScreen } from './teacher/TeacherMessagesScreen';
import { TeacherAnnouncementsScreen } from './teacher/TeacherAnnouncementsScreen';
import { TeacherProfileScreen } from './teacher/TeacherProfileScreen';
import { TeacherResultsScreen } from './teacher/TeacherResultsScreen';
import { mergeTeacherPrewarmTabs } from './teacher/teacherShellPrewarm.js';
import { RoleNotificationsScreen } from './shared/RoleNotificationsScreen';
import { getMountedRoleTabs, rememberRoleTab } from './shared/roleShellTabMounting.js';
import { colors, getRolePalette } from '../theme';
import { useDashboardTheme } from '../dashboardTheme';

const TEACHER = getRolePalette('teacher');

const bottomTabs = [
  { key: 'dashboard', label: 'Home', icon: 'home' },
  { key: 'classroom', label: 'Classroom', icon: 'clipboard' },
  { key: 'attendance', label: 'Attendance', icon: 'check-square' },
  { key: 'results', label: 'Results', icon: 'bar-chart-2' },
  { key: 'messages', label: 'Inbox', icon: 'inbox' },
];

const drawerItems = [
  ...bottomTabs,
  { key: 'assignments', label: 'Assignments', icon: 'file-text' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'announcements', label: 'Notices', icon: 'bell' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

// Memoized Sub-screens for Performance
const MemoizedTeacherDashboard = memo(TeacherDashboardScreen);
const MemoizedTeacherOps = memo(TeacherOpsScreen);
const MemoizedTeacherAttendance = memo(TeacherAttendanceScreen);
const MemoizedTeacherResults = memo(TeacherResultsScreen);
const MemoizedTeacherAssignments = memo(TeacherAssignmentsScreen);
const MemoizedTeacherMessages = memo(TeacherMessagesScreen);
const MemoizedTeacherAnnouncements = memo(TeacherAnnouncementsScreen);
const MemoizedTeacherProfile = memo(TeacherProfileScreen);

export function TeacherShellScreen({ profile, onSignedOut }) {
  const { theme } = useDashboardTheme();
  const [tab, setTab] = useState('dashboard');
  const [visitedTabs, setVisitedTabs] = useState(['dashboard']);
  const [profileOverrides, setProfileOverrides] = useState({});
  const primaryTabs = useMemo(() => bottomTabs.map((item) => item.key), []);

  const shellProfile = useMemo(() => ({
    ...(profile || {}),
    ...(profileOverrides || {})
  }), [profile, profileOverrides]);

  const handleTabSelect = useCallback((nextTab) => {
    setTab(nextTab);
    setVisitedTabs(prev => prev.includes(nextTab) ? prev : [...prev, nextTab]);
  }, []);

  const handleProfileUpdate = useCallback((nextProfile) => {
    setProfileOverrides(current => ({
      ...(current || {}),
      ...(nextProfile || {}),
    }));
  }, []);

  useEffect(() => {
    setProfileOverrides({});
  }, [
    profile?.fullName,
    profile?.email,
    profile?.phone,
    profile?.status,
    profile?.avatarUrl,
  ]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    onSignedOut?.();
  }, [onSignedOut]);

  useEffect(() => {
    setVisitedTabs((current) => rememberRoleTab(current, tab, primaryTabs));
  }, [primaryTabs, tab]);

  useEffect(() => {
    if (tab !== 'dashboard') return;
    const timer = setTimeout(() => {
      setVisitedTabs((current) => mergeTeacherPrewarmTabs(current, primaryTabs));
    }, 600);
    return () => clearTimeout(timer);
  }, [primaryTabs, tab]);

  const mountedTabs = useMemo(
    () => getMountedRoleTabs(tab, visitedTabs, primaryTabs),
    [primaryTabs, tab, visitedTabs]
  );

  const renderTabContent = (nextTab) => {
    switch (nextTab) {
      case 'dashboard':
        return <MemoizedTeacherDashboard profile={shellProfile} onNavigate={handleTabSelect} />;
      case 'classroom':
        return <MemoizedTeacherOps profile={shellProfile} onSignedOut={onSignedOut} />;
      case 'attendance':
        return <MemoizedTeacherAttendance profile={shellProfile} />;
      case 'results':
        return <MemoizedTeacherResults profile={shellProfile} />;
      case 'assignments':
        return <MemoizedTeacherAssignments profile={shellProfile} />;
      case 'notifications':
        return (
          <RoleNotificationsScreen
            summary="Attendance alerts, publishing updates, and school notices appear here."
            emptyMessage="New teacher alerts will appear here as your classes become active."
          />
        );
      case 'messages':
        return <MemoizedTeacherMessages profile={shellProfile} />;
      case 'announcements':
        return <MemoizedTeacherAnnouncements profile={shellProfile} />;
      case 'profile':
        return (
          <MemoizedTeacherProfile
            profile={shellProfile}
            onSignedOut={onSignedOut}
            onNavigate={handleTabSelect}
            onProfileUpdated={handleProfileUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <PremiumShell
        role="teacher"
        profile={shellProfile}
        title={shellProfile?.fullName || 'Teacher'}
        subtitle={shellProfile?.email || 'Manage classes, attendance, and communication'}
        items={drawerItems.map((item) => ({ ...item, description: item.label === 'Home' ? 'Today overview' : undefined }))}
        activeKey={tab}
        onSelect={handleTabSelect}
        onSignOut={handleSignOut}
        bottomTabs={bottomTabs}
      >
        <View style={styles.tabDeck}>
          {mountedTabs.map((mountedTab) => {
            const isActive = mountedTab === tab;
            return (
              <View
                key={mountedTab}
                style={[styles.tabSurface, !isActive ? styles.tabSurfaceHidden : null]}
                pointerEvents={isActive ? 'auto' : 'none'}
              >
                {renderTabContent(mountedTab)}
              </View>
            );
          })}
        </View>
      </PremiumShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TEACHER.bg,
  },
  tabDeck: {
    flex: 1,
    minHeight: 0,
  },
  tabSurface: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  tabSurfaceHidden: {
    display: 'none',
  },
});
