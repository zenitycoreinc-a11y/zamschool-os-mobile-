import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { AccountProfileView } from '../components/shared/AccountProfileView';
import { PremiumShell } from '../components/shared/PremiumShell';
import { AdminAnnouncementsScreen } from './AdminAnnouncementsScreen';
import { signOut } from '../services/authService';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { getRolePolicy } from '../config/roleCapabilities';
import { getAdminOverviewCounts, getAdminUsersDirectory } from '../services/adminService';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { AdminRollCallMonitorScreen } from './admin/AdminRollCallMonitorScreen';
import { AdminPeopleScreen } from './admin/AdminPeopleScreen';
import { RoleNotificationsScreen } from './shared/RoleNotificationsScreen';
import { getMountedRoleTabs, rememberRoleTab } from './shared/roleShellTabMounting.js';
import { colors, getRolePalette, radii, shadows } from '../theme';
import { useDashboardTheme } from '../dashboardTheme';

const ADMIN = getRolePalette('admin');
const ADMIN_POLICY = getRolePolicy('admin');

// Memoized Sub-screens for Performance
const MemoizedAdminOverview = memo(({ profile }) => {
  const { data: counts, error, isLoading, load } = useAsyncResource(
    useCallback(async () => {
      const response = await getAdminOverviewCounts();
      return response || { profiles: 0, students: 0, teachers: 0, announcements: 0, classes: 0, notice: '' };
    }, []),
    { initialData: { profiles: 0, students: 0, teachers: 0, announcements: 0, classes: 0, notice: '' } }
  );

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {counts?.notice ? <Text style={styles.notice}>{counts.notice}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.meta}>Welcome, {profile?.fullName || 'Admin'}.</Text>
        <Text style={styles.helper}>Operational mobile overview while heavier management stays web-first.</Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.miniCard}>
          <Text style={styles.miniValue}>{counts?.profiles ?? 0}</Text>
          <Text style={styles.miniLabel}>Profiles</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniValue}>{counts?.students ?? 0}</Text>
          <Text style={styles.miniLabel}>Students</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniValue}>{counts?.teachers ?? 0}</Text>
          <Text style={styles.miniLabel}>Teachers</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniValue}>{counts?.classes ?? 0}</Text>
          <Text style={styles.miniLabel}>Classes</Text>
        </View>
      </View>
    </ScrollView>
  );
});

const MemoizedAdminRollCall = memo(AdminRollCallMonitorScreen);
const MemoizedAdminPeople = memo(AdminPeopleScreen);
const MemoizedAdminAnnouncements = memo(AdminAnnouncementsScreen);

const MemoizedAdminProfile = memo(({ profile, onSignedOut, onNavigate, onProfileUpdated }) => {
  const { data, error, isLoading, load } = useAsyncResource(
    useCallback(async () => getAdminOverviewCounts(), []),
    {
      initialData: {
        profiles: 0,
        students: 0,
        teachers: 0,
        announcements: 0,
        classes: 0,
        notice: '',
      },
    }
  );

  if (isLoading) return <LoadingState />;

  return (
    <AccountProfileView
      profile={profile}
      roleLabel="Admin"
      roleIcon="shield"
      summaryChips={[
        `${data?.profiles || 0} profiles`,
        `${data?.students || 0} students`,
        `${data?.classes || 0} classes`,
      ]}
      infoItems={[
        { label: 'Email', value: profile?.email || 'Not set', icon: 'mail' },
        { label: 'Phone', value: profile?.phone || 'Not set', icon: 'phone' },
        { label: 'Status', value: profile?.status || 'Unknown', icon: 'activity' },
        { label: 'Role', value: 'Admin', icon: 'shield' },
      ]}
      extraSections={[
        {
          title: 'Operations Snapshot',
          rows: [
            { label: 'Profiles', value: String(data?.profiles || 0) },
            { label: 'Students', value: String(data?.students || 0) },
            { label: 'Teachers', value: String(data?.teachers || 0) },
            { label: 'Announcements', value: String(data?.announcements || 0) },
            { label: 'Classes', value: String(data?.classes || 0) },
          ],
        },
      ]}
      accountItems={[
        {
          icon: 'bell',
          label: 'Notifications',
          sub: 'Review system and school alerts',
          action: 'notifications',
        },
        {
          icon: 'lock',
          label: 'Change Password',
          sub: 'Send a secure reset link to your email',
          action: 'password',
        },
        {
          icon: 'image',
          label: 'Upload Photo',
          sub: 'Keep your admin identity current',
          action: 'photo',
        },
      ]}
      aboutText="Admin mobile workspace"
      errorMessage={error || data?.notice || ''}
      onRetry={load}
      onNavigate={onNavigate}
      onProfileUpdated={onProfileUpdated}
      onSignedOut={onSignedOut}
    />
  );
});

const bottomTabs = [
  { key: 'overview', label: 'Overview', icon: 'home' },
  { key: 'rollcall', label: 'Roll Call', icon: 'clipboard' },
  { key: 'people', label: 'People', icon: 'users' },
  { key: 'notifications', label: 'Inbox', icon: 'inbox' },
];

const drawerItems = [
  ...bottomTabs,
  ...(ADMIN_POLICY.mobilePreview.management === 'hidden'
    ? []
    : [{ key: 'management', label: 'Links', icon: 'link' }]),
  { key: 'announcements', label: 'Announcements', icon: 'bell' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export function AdminShellScreen({ profile, onSignedOut }) {
  const { theme } = useDashboardTheme();
  const [tab, setTab] = useState('overview');
  const [visitedTabs, setVisitedTabs] = useState(['overview']);
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

  const mountedTabs = useMemo(
    () => getMountedRoleTabs(tab, visitedTabs, primaryTabs),
    [primaryTabs, tab, visitedTabs]
  );

  const renderTabContent = (nextTab) => {
    switch (nextTab) {
      case 'overview':
        return <MemoizedAdminOverview profile={shellProfile} />;
      case 'rollcall':
        return <MemoizedAdminRollCall profile={shellProfile} />;
      case 'people':
        return <MemoizedAdminPeople profile={shellProfile} />;
      case 'notifications':
        return (
          <RoleNotificationsScreen
            role="admin"
            summary="System alerts, school notices, and management reminders appear here."
            emptyMessage="Admin alerts will appear here when there is activity that needs review."
          />
        );
      case 'announcements':
        return <MemoizedAdminAnnouncements profile={shellProfile} onSignedOut={onSignedOut} />;
      case 'profile':
        return (
          <MemoizedAdminProfile
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
        role="admin"
        profile={shellProfile}
        title={shellProfile?.fullName || 'Admin'}
        subtitle={shellProfile?.email || 'Manage users, notices, and school setup'}
        items={drawerItems}
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 90 },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  meta: { color: colors.textSoft, fontSize: 13, marginBottom: 4, fontWeight: '600' },
  helper: { color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  notice: {
    color: ADMIN.accentStrong,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: {
    width: '47%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  miniValue: { color: ADMIN.accentStrong, fontSize: 24, fontWeight: '800' },
  miniLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
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
