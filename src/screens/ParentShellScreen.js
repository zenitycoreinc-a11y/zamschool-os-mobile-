import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ParentMessagesScreen } from './ParentMessagesScreen';
import { ParentAttendanceScreen } from './parent/ParentAttendanceScreen';
import { ParentNotificationsScreen } from './parent/ParentNotificationsScreen';
import { AccountProfileView } from '../components/shared/AccountProfileView';
import { ContentDetailSheet } from '../components/shared/ContentDetailSheet';
import { PremiumShell } from '../components/shared/PremiumShell';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { FeedCard, FeedCardIcon } from '../components/ui/FeedCard';
import { FeedHero, FeedHeroAction } from '../components/ui/FeedHero';
import { FeedSection } from '../components/ui/FeedSection';
import { LoadingState } from '../components/ui/LoadingState';
import { getMountedRoleTabs, rememberRoleTab } from './shared/roleShellTabMounting.js';
import { listAnnouncements, peekAnnouncements } from '../services/announcementService';
import { signOut } from '../services/authService';
import {
  getParentDashboardSummary,
  getParentFeesSummary,
  getParentProgressSummary,
  peekParentProgressSummary,
} from '../services/parentService';
import { getRolePalette, radii, shadows, spacing } from '../theme';
import { formatDate } from '../utils/date';
import { useDashboardTheme } from '../dashboardTheme';

const palette = getRolePalette('parent');

const COLORS = {
  bg: palette.bg || '#F4F6FB',
  surface: palette.surface || '#FFFFFF',
  border: palette.border || '#DCE4EE',
  text: palette.text || '#0F172A',
  muted: palette.muted || '#5B667A',
  primary: palette.accent || '#2F6FED',
  primarySoft: palette.accentSoft || '#EAF1FF',
  info: palette.accent || '#1D4ED8',
  warning: '#B45309',
  success: '#15803D',
  danger: '#DC2626',
};

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'messages', label: 'Inbox', icon: 'message-circle' },
  { key: 'progress', label: 'Progress', icon: 'bar-chart-2' },
  { key: 'fees', label: 'Fees', icon: 'credit-card' },
];

const drawerItems = [
  { key: 'home', label: 'Home', icon: 'home', description: 'Family overview' },
  { key: 'messages', label: 'Inbox', icon: 'message-circle', description: 'School conversations' },
  { key: 'progress', label: 'Progress', icon: 'bar-chart-2', description: 'Attendance and results' },
  { key: 'fees', label: 'Fees', icon: 'credit-card', description: 'Balances and reminders' },
  { key: 'attendance', label: 'Attendance', icon: 'calendar', description: 'Child lesson history' },
  { key: 'notifications', label: 'Notifications', icon: 'bell', description: 'Attendance and notice alerts' },
  { key: 'notices', label: 'Notices', icon: 'book-open', description: 'Published school updates' },
  { key: 'profile', label: 'Profile', icon: 'user', description: 'Account and family details' },
];

function MetricCard({ title, value, note, icon, color }) {
  return (
    <View style={[styles.metricCard, styles.shadow]}>
      <View style={styles.metricHead}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{String(value)}</Text>
      <Text style={styles.metricNote}>{note}</Text>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.actionRow, pressed ? { opacity: 0.82 } : null]} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <Feather name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#98A2B3" />
    </Pressable>
  );
}

function ParentHomeScreen({ profile, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setError('');
      const s = await getParentDashboardSummary();
      setSummary(s);
    } catch (e) {
      setError(e.message || 'Failed to load parent dashboard.');
      setSummary({
        childrenCount: 0,
        announcementsCount: 0,
        unreadMessages: 0,
        childrenNote: 'No children linked yet',
        messagesNote: 'No unread messages',
        noticesNote: 'No notices published',
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      <View style={[styles.heroCard, styles.shadow]}>
        <Text style={styles.heroTitle}>Parent Dashboard</Text>
        <Text style={styles.heroSub}>Welcome, {profile?.fullName || 'Parent'}</Text>
        <Text style={styles.heroText}>
          Stay informed on attendance, inbox alerts, fees, messages and school notices.
        </Text>
      </View>

      <View>
        <MetricCard
          title="Children"
          value={`${summary?.childrenCount ?? 0}`}
          note={summary?.childrenNote || 'No children linked yet'}
          icon="users"
          color={COLORS.primary}
        />
        <MetricCard
          title="Unread Messages"
          value={`${summary?.unreadMessages ?? 0}`}
          note={summary?.messagesNote || 'No unread messages'}
          icon="message-circle"
          color={COLORS.warning}
        />
        <MetricCard
          title="School Notices"
          value={`${summary?.announcementsCount ?? 0}`}
          note={summary?.noticesNote || 'No notices published'}
          icon="bell"
          color={COLORS.info}
        />
      </View>

      <View style={[styles.block, styles.shadow]}>
        <Text style={styles.blockTitle}>Parent Actions</Text>
        <ActionRow
          icon="message-circle"
          title="Open inbox"
          subtitle="Read and follow up communication quickly"
          onPress={() => onNavigate('messages')}
        />
        <ActionRow
          icon="bell"
          title="Open notifications"
          subtitle="Attendance alerts, notices and school events"
          onPress={() => onNavigate('notifications')}
        />
        <ActionRow
          icon="calendar"
          title="View child attendance"
          subtitle="Lesson attendance for all linked children"
          onPress={() => onNavigate('attendance')}
        />
        <ActionRow
          icon="bar-chart-2"
          title="View child progress"
          subtitle="Attendance and results overview"
          onPress={() => onNavigate('progress')}
        />
        <ActionRow
          icon="credit-card"
          title="Check fee status"
          subtitle="Balance and payment reminders"
          onPress={() => onNavigate('fees')}
        />
        <ActionRow
          icon="bell"
          title="Read school notices"
          subtitle="Important updates and announcements"
          onPress={() => onNavigate('notices')}
        />
      </View>
    </ScrollView>
  );
}

function ParentNoticesScreen() {
  const palette = getRolePalette('parent');
  const [items, setItems] = useState(() => peekAnnouncements(20) || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !peekAnnouncements(20));
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const load = async () => {
    try {
      setError('');
      const rows = await listAnnouncements(20);
      setItems(rows);
    } catch (e) {
      setError(e.message || 'Failed to load school notices.');
      setItems([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading && !items) return <LoadingState />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <ErrorBanner message={error} onRetry={load} /> : null}

        <FeedHero
          title="School Notices"
          summary={
            (items || []).length
              ? 'Published updates and family-facing notices from the school.'
              : 'School notices will appear here once they are published.'
          }
          chips={[
            `${(items || []).length} notices`,
            (items || [])[0]?.title ? `Latest: ${(items || [])[0].title}` : 'Quiet noticeboard',
            'Tap to open',
          ]}
          accent={palette.accentStrong}
          accentSoft={palette.accentSoft}
          meta={
            <FeedHeroAction
              label="Refresh"
              onPress={load}
              icon="rotate-cw"
              accent={palette.accentStrong}
              accentSoft={palette.accentSoft}
            />
          }
        />

        <FeedSection title="Recent notices" action={(items || []).length ? 'Latest first' : ''}>
          {(items || []).length === 0 ? (
            <EmptyState
              icon="bell"
              title="No notices yet"
              message="School notices will appear here."
              supportingTone="info"
            />
          ) : (
            (items || []).map((item) => (
              <FeedCard
                key={item.id}
                onPress={() => setSelectedAnnouncement(item)}
                leading={<FeedCardIcon icon="bell" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
                eyebrow="School notice"
                title={item.title || 'Announcement'}
                message={item.body || item.content || 'No notice details available.'}
                timestamp={formatDate(item.created_at || item.published_at)}
              />
            ))
          )}
        </FeedSection>
      </ScrollView>

      <ContentDetailSheet
        visible={Boolean(selectedAnnouncement)}
        title={selectedAnnouncement?.title || 'School notice'}
        eyebrow="Notice"
        subtitle="Published update"
        timestamp={
          selectedAnnouncement?.created_at || selectedAnnouncement?.published_at
            ? formatDate(selectedAnnouncement.created_at || selectedAnnouncement.published_at)
            : ''
        }
        metadataItems={[
          { label: 'Audience', value: 'Parent account' },
          { label: 'Source', value: 'School' },
        ]}
        body={selectedAnnouncement?.body || selectedAnnouncement?.content || 'No notice details available.'}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </>
  );
}

function ParentProgressScreen() {
  const palette = getRolePalette('parent');
  const [summary, setSummary] = useState(() => peekParentProgressSummary() || null);
  const [loading, setLoading] = useState(() => !peekParentProgressSummary());
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await getParentProgressSummary();
      setSummary(data);
    } catch (e) {
      setError(e.message || 'Failed to load progress');
      setSummary({ linkedChildren: [], attendanceRate: null, latestResults: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      <FeedHero
        title="Child Progress"
        summary="Attendance and latest published results for linked children, designed for quick parent check-ins."
        chips={[
          summary?.attendanceRate == null ? 'No attendance rate yet' : `${summary.attendanceRate}% attendance`,
          `${summary?.linkedChildren?.length || 0} linked children`,
          `${summary?.latestResults?.length || 0} result entries`,
        ]}
        accent={palette.accentStrong}
        accentSoft={palette.accentSoft}
        meta={
          <FeedHeroAction
            label="Refresh"
            onPress={load}
            icon="rotate-cw"
            accent={palette.accentStrong}
            accentSoft={palette.accentSoft}
          />
        }
      />

      <FeedSection title="Children in view" action={`${summary?.linkedChildren?.length || 0} linked`}>
        {(summary?.linkedChildren || []).length === 0 ? (
          <EmptyState
            icon="users"
            title="No linked children yet"
            message="Progress will appear here once children are linked to this parent account."
            supportingTone="info"
          />
        ) : (
          summary.linkedChildren.map((child) => (
            <FeedCard
              key={child.id || child.name}
              leading={<FeedCardIcon icon="users" color={palette.accentStrong} backgroundColor={palette.accentSoft} />}
              eyebrow="Linked child"
              title={child.name || 'Student'}
              message={[
                child?.attendanceRate == null
                  ? 'Attendance rate not available yet.'
                  : `${child.attendanceRate}% attendance in the current view.`,
                child?.latestResult
                  ? `Latest result: ${Math.round(child.latestResult.score)}%.`
                  : 'No result published yet.',
              ].join(' ')}
              timestamp="Family overview"
            />
          ))
        )}
      </FeedSection>

      <FeedSection title="Latest Results" action={(summary?.latestResults || []).length ? 'Latest first' : ''}>
        {(summary?.latestResults || []).length === 0 ? (
          <EmptyState
            icon="bar-chart-2"
            title="No result records yet"
            message="Results will appear here as soon as teachers publish them."
            supportingTone="celebratory"
          />
        ) : (
          summary.latestResults.map((row, idx) => (
            <FeedCard
              key={`${row.studentName}-${idx}`}
              leading={<FeedCardIcon icon="bar-chart-2" color={palette.highlight} backgroundColor={palette.surfaceSoft} />}
              eyebrow="Published result"
              title={row.studentName}
              message={`Latest recorded score for this view: ${Math.round(row.score)}%.`}
              timestamp={row.createdAt ? formatDate(row.createdAt) : 'Latest score'}
              accessory={
                <View style={styles.parentMetricPill}>
                  <Text style={styles.parentMetricPillText}>{Math.round(row.score)}%</Text>
                </View>
              }
            />
          ))
        )}
      </FeedSection>
    </ScrollView>
  );
}

function ParentFeesScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await getParentFeesSummary();
      setSummary(data);
    } catch (e) {
      setError(e.message || 'Failed to load fee status');
      setSummary({ balance: null, upcomingDue: null, recentPayments: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      <View style={[styles.block, styles.shadow]}>
        <Text style={styles.blockTitle}>Fees</Text>
        <Text style={styles.line}>
          Current balance: {summary?.balance == null ? 'No fee records' : `ZMW ${Number(summary.balance).toLocaleString()}`}
        </Text>
        <Text style={styles.line}>
          Upcoming due date: {summary?.upcomingDue || 'No due date available'}
        </Text>
      </View>

      {(summary?.recentPayments || []).length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="No recent payments"
          message="Payment history will appear after successful fee transactions."
          supportingTone="info"
        />
      ) : (
        <View style={[styles.block, styles.shadow]}>
          <Text style={styles.blockTitle}>Recent Payments</Text>
          {summary.recentPayments.map((row, idx) => (
            <View key={`${row.reference}-${idx}`} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{row.reference}</Text>
              <Text style={styles.dataValue}>ZMW {Number(row.amount || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ParentProfileScreen({ profile, onSignedOut, onNavigate, onProfileUpdated }) {
  const [summary, setSummary] = useState({
    linkedChildren: [],
    attendanceRate: null,
    latestResults: [],
    balance: null,
    upcomingDue: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [progress, fees] = await Promise.all([
        getParentProgressSummary(),
        getParentFeesSummary(),
      ]);
      setSummary({
        linkedChildren: progress?.linkedChildren || [],
        attendanceRate: progress?.attendanceRate ?? null,
        latestResults: progress?.latestResults || [],
        balance: fees?.balance ?? null,
        upcomingDue: fees?.upcomingDue ?? null,
      });
    } catch (e) {
      setError(e.message || 'Failed to load parent profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !summary) return <LoadingState />;

  return (
    <AccountProfileView
      profile={profile}
      roleLabel="Parent"
      roleIcon="users"
      summaryChips={[
        `${summary.linkedChildren.length} children`,
        summary.attendanceRate == null ? 'No attendance rate yet' : `${summary.attendanceRate}% attendance`,
        summary.balance == null ? 'No fee balance yet' : `ZMW ${summary.balance}`,
      ]}
      infoItems={[
        { label: 'Email', value: profile?.email || 'Not set', icon: 'mail' },
        { label: 'Phone', value: profile?.phone || 'Not set', icon: 'phone' },
        { label: 'Status', value: profile?.status || 'Unknown', icon: 'activity' },
        { label: 'Role', value: 'Parent', icon: 'users' },
      ]}
      extraSections={[
        {
          title: 'Family',
          rows:
            summary.linkedChildren.length > 0
              ? summary.linkedChildren.map((child) => ({
                  label: child.name,
                  value: child.className || 'Linked child',
                }))
              : [{ label: 'Linked children', value: 'No children linked yet' }],
        },
        {
          title: 'Fees',
          rows: [
            { label: 'Balance', value: summary.balance == null ? 'Not available' : `ZMW ${summary.balance}` },
            { label: 'Upcoming due', value: summary.upcomingDue || 'No due date' },
          ],
        },
        {
          title: 'Latest Result',
          rows:
            summary.latestResults.length > 0
              ? [
                  {
                    label: summary.latestResults[0].studentName || 'Student',
                    value: `${summary.latestResults[0].score}%`,
                  },
                ]
              : [{ label: 'Results', value: 'No results published yet' }],
        },
      ]}
      accountItems={[
        {
          icon: 'bell',
          label: 'Notifications',
          sub: 'Review parent alerts and school updates',
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
          sub: 'Keep your parent profile current',
          action: 'photo',
        },
      ]}
      aboutText="Parent mobile workspace"
      errorMessage={error}
      onRetry={load}
      onNavigate={onNavigate}
      onProfileUpdated={onProfileUpdated}
      onSignedOut={onSignedOut}
    />
  );
}

export function ParentShellScreen({ profile, onSignedOut }) {
  const { theme } = useDashboardTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [visitedTabs, setVisitedTabs] = useState(() => ['home']);
  const [pendingAttendanceStudentId, setPendingAttendanceStudentId] = useState(null);
  const [profileOverrides, setProfileOverrides] = useState({});
  const primaryTabs = useMemo(() => bottomTabs.map((tab) => tab.key), []);

  useEffect(() => {
    setProfileOverrides({});
  }, [
    profile?.fullName,
    profile?.email,
    profile?.phone,
    profile?.status,
    profile?.avatarUrl,
  ]);

  const shellProfile = { ...(profile || {}), ...(profileOverrides || {}) };

  const navigateTo = (nextTab, options = {}) => {
    if (nextTab === 'attendance') {
      setPendingAttendanceStudentId(options.studentId || null);
    } else if (nextTab !== 'notifications') {
      setPendingAttendanceStudentId(null);
    }
    setActiveTab(nextTab);
  };

  useEffect(() => {
    setVisitedTabs((current) => rememberRoleTab(current, activeTab, primaryTabs));
  }, [activeTab, primaryTabs]);

  const mountedTabs = useMemo(
    () => getMountedRoleTabs(activeTab, visitedTabs, primaryTabs),
    [activeTab, primaryTabs, visitedTabs]
  );

  const renderTab = (tab) => {
    if (tab === 'home') return <ParentHomeScreen profile={shellProfile} onNavigate={navigateTo} />;
    if (tab === 'attendance') {
      return (
        <ParentAttendanceScreen
          embedded
          initialStudentId={pendingAttendanceStudentId}
        />
      );
    }
    if (tab === 'notifications') {
      return (
        <ParentNotificationsScreen
          embedded
          onOpenAttendance={(studentId) => navigateTo('attendance', { studentId })}
        />
      );
    }
    if (tab === 'messages') return <ParentMessagesScreen embedded />;
    if (tab === 'progress') return <ParentProgressScreen />;
    if (tab === 'fees') return <ParentFeesScreen />;
    if (tab === 'notices') return <ParentNoticesScreen />;
    return (
      <ParentProfileScreen
        profile={shellProfile}
        onSignedOut={onSignedOut}
        onNavigate={navigateTo}
        onProfileUpdated={(nextProfile) =>
          setProfileOverrides((current) => ({
            ...(current || {}),
            ...(nextProfile || {}),
          }))
        }
      />
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <PremiumShell
        role="parent"
        profile={shellProfile}
        title={shellProfile?.fullName || 'Parent'}
        subtitle={shellProfile?.email || 'Keep track of your children, messages, and fees'}
        items={drawerItems}
        activeKey={activeTab}
        onSelect={navigateTo}
        onSignOut={async () => {
          await signOut();
          onSignedOut?.();
        }}
        bottomTabs={bottomTabs}
      >
        <View style={styles.tabDeck}>
          {mountedTabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <View
                key={tab}
                style={[styles.tabSurface, !isActive ? styles.tabSurfaceHidden : null]}
                pointerEvents={isActive ? 'auto' : 'none'}
                accessibilityElementsHidden={!isActive}
                importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
              >
                {renderTab(tab)}
              </View>
            );
          })}
        </View>
      </PremiumShell>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  topTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  topSub: { marginTop: 3, fontSize: 15, color: COLORS.muted, fontWeight: '600' },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 14, paddingBottom: 116 },
  heroCard: {
    backgroundColor: palette.accentSoft || '#EAF1FF',
    borderWidth: 1,
    borderColor: palette.border || '#D8E2F0',
    borderRadius: 18,
    padding: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: palette.accentStrong || '#153E8A' },
  heroSub: { marginTop: 7, fontSize: 17, fontWeight: '800', color: palette.accent || '#2F6FED' },
  heroText: { marginTop: 10, fontSize: 16, lineHeight: 24, color: palette.textSoft || '#33445E' },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  metricHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricTitle: { fontSize: 14, fontWeight: '800', color: COLORS.muted },
  metricValue: { marginTop: 8, fontSize: 34, fontWeight: '900' },
  metricNote: { marginTop: 4, fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  block: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  blockTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  actionSub: { fontSize: 14, color: COLORS.muted, marginTop: 2, lineHeight: 20, fontWeight: '600' },
  tabDeck: {
    flex: 1,
    minHeight: 0,
  },
  tabSurface: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  tabSurfaceHidden: {
    opacity: 0,
  },
  line: { fontSize: 16, color: '#334155', lineHeight: 24, fontWeight: '600' },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  dataLabel: { fontSize: 15, color: '#334155', fontWeight: '700', flex: 1, paddingRight: 8 },
  dataValue: { fontSize: 15, color: palette.accent || '#2F6FED', fontWeight: '900' },
  parentMetricPill: {
    borderRadius: radii.pill,
    backgroundColor: palette.accentSoft || '#EAF1FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    ...shadows.card,
  },
  parentMetricPillText: {
    color: palette.accentStrong || '#153E8A',
    fontSize: 11,
    fontWeight: '800',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bottomBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  bottomIndicatorTrack: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bottomActivePill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
  },
  bottomItem: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center' },
  bottomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconWrapActive: { backgroundColor: COLORS.primarySoft },
  bottomLabel: { marginTop: 3, fontSize: 13, fontWeight: '800', color: '#98A2B3' },
  bottomLabelActive: { color: COLORS.primary },
  shadow: {
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
});
