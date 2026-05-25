import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { AdminShellScreen } from './src/screens/AdminShellScreen';
import { TeacherShellScreen } from './src/screens/TeacherShellScreen';
import { UnsupportedRoleScreen } from './src/screens/UnsupportedRoleScreen';
import { StudentShellScreen } from './src/screens/StudentShellScreen';
import { ParentShellScreen } from './src/screens/ParentShellScreen';
import { PaymentsShellScreen } from './src/screens/PaymentsShellScreen';
import { ForcePasswordChangeScreen } from './src/screens/ForcePasswordChangeScreen';
import { getSessionViewState, useSession } from './src/hooks/useSession';
import { isSupabaseConfigured } from './src/services/supabase';
import { resolvePostLoginStep } from './src/services/loginPolicy';
import { appRoleMeta, colors, motion, radii, shadows, spacing, supportedRoles } from './src/theme';
import { DashboardThemeProvider } from './src/dashboardTheme';

const roleShells = {
  admin: AdminShellScreen,
  teacher: TeacherShellScreen,
  student: StudentShellScreen,
  parent: ParentShellScreen,
  payments: PaymentsShellScreen,
};

function resolveRoleShell(profile) {
  return profile ? roleShells[profile.role] || null : null;
}

function resolveSessionSurface({ sessionViewState, error, profile, refreshProfile, setError }) {
  if (sessionViewState === 'loading') {
    return {
      statusBarStyle: 'dark',
      gradientColors: [colors.bg, colors.bgSoft, colors.bgStrong],
      content: <LoadingSurface />,
    };
  }

  if (sessionViewState === 'signed-out') {
    return {
      statusBarStyle: 'light',
      gradientColors: [colors.bg, colors.bgSoft, colors.bgStrong],
      content: <LoginScreen globalError={error} onClearError={() => setError('')} />,
    };
  }

  if (sessionViewState === 'missing-profile') {
    return {
      statusBarStyle: 'dark',
      gradientColors: [colors.bg, colors.bgSoft, colors.bgStrong],
      content: (
        <CenterMessage
          title="Profile not found"
          subtitle={error || 'Your auth user exists but no profile row was found. Contact admin.'}
        />
      ),
    };
  }

  if (sessionViewState === 'profile-error') {
    return {
      statusBarStyle: 'dark',
      gradientColors: [colors.bg, colors.bgSoft, colors.bgStrong],
      content: (
        <CenterMessage
          title="Profile unavailable"
          subtitle={error || 'We could not refresh your profile right now. Try again shortly.'}
        />
      ),
    };
  }

  if (sessionViewState && profile && resolvePostLoginStep(profile) === 'force-password-change') {
    return {
      statusBarStyle: 'light',
      gradientColors: getShellGradientColors(profile),
      content: <ForcePasswordChangeScreen profile={profile} onCompleted={refreshProfile} />,
    };
  }

  return null;
}

function getShellGradientColors(profile) {
  const activeRoleMeta = profile ? appRoleMeta[profile.role] : null;
  return activeRoleMeta ? [activeRoleMeta.bg, activeRoleMeta.bgSoft, activeRoleMeta.bgStrong] : [colors.bg, colors.bgSoft, colors.bgStrong];
}

function CenterMessage({ title, subtitle }) {
  return (
    <SafeAreaView style={styles.fullscreenSafe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.centerCard}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function AppSurface({ children, statusBarStyle = 'dark', gradientColors = [colors.bg, colors.bgSoft, colors.bgStrong] }) {
  return (
    <>
      <View style={styles.appRoot}>
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
        <View style={styles.appContent}>{children}</View>
      </View>
      <StatusBar style={statusBarStyle} />
    </>
  );
}

function SplashIntro() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 120,
        damping: 15,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <>
      <View style={styles.splashRoot}>
        <LinearGradient colors={[colors.heroBackdropStart, colors.heroBackdropMid, colors.heroBackdropEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.splashWash} />
        <View style={styles.splashGlowOne} />
        <View style={styles.splashGlowTwo} />
        <View style={styles.splashGlowThree} />
        <SafeAreaView style={styles.fullscreenSafe} edges={['top', 'bottom']}>
          <View style={styles.splashStage}>
            <Animated.View style={[styles.splashCard, { opacity, transform: [{ scale }, { translateY }] }]}>
              <View style={styles.splashBadge}>
                <Image source={require('./assets/zam-school-os-icon-512.png')} style={styles.splashLogo} />
              </View>
              <View style={styles.splashPill}>
                <Text style={styles.splashPillText}>Secure mobile entry</Text>
              </View>
              <Text style={styles.splashTitle}>ZAM School OS</Text>
              <Text style={styles.splashSub}>Premium school operations, built for calm mobile use.</Text>
              <View style={styles.splashMetaRow}>
                <View style={styles.splashMetaChip}>
                  <Text style={styles.splashMetaText}>Private sign-in</Text>
                </View>
                <View style={styles.splashMetaChip}>
                  <Text style={styles.splashMetaText}>Role aware</Text>
                </View>
                <View style={styles.splashMetaChip}>
                  <Text style={styles.splashMetaText}>Fast restore</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
      <StatusBar style="light" />
    </>
  );
}

function LoadingSurface() {
  return (
    <SafeAreaView style={styles.fullscreenSafe} edges={['top', 'bottom']}>
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const { session, profile, loading, profileResolved, error, setError, refreshProfile } = useSession();

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 320);
    return () => clearTimeout(t);
  }, []);

  let appContent = <SplashIntro />;

  if (splashDone) {
    if (!isSupabaseConfigured) {
      appContent = (
        <AppSurface statusBarStyle="dark">
          <CenterMessage
            title="Supabase not configured"
            subtitle="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env"
          />
        </AppSurface>
      );
    } else {
      const sessionViewState = getSessionViewState({
        session,
        profile,
        loading,
        profileResolved,
        error,
      });
      const sessionSurface = resolveSessionSurface({
        sessionViewState,
        error,
        profile,
        refreshProfile,
        setError,
      });

      if (sessionSurface) {
        appContent = (
          <AppSurface statusBarStyle={sessionSurface.statusBarStyle} gradientColors={sessionSurface.gradientColors}>
            {sessionSurface.content}
          </AppSurface>
        );
      } else {
        const RoleShell = resolveRoleShell(profile);
        const isSupportedRole = profile ? supportedRoles.includes(profile.role) : false;
        const shellGradientColors = getShellGradientColors(profile);

        appContent = (
          <AppSurface statusBarStyle="light" gradientColors={shellGradientColors}>
            <DashboardThemeProvider>
              {isSupportedRole && RoleShell ? (
                <RoleShell profile={profile} onSignedOut={refreshProfile} />
              ) : (
                <UnsupportedRoleScreen profile={profile} onSignedOut={refreshProfile} />
              )}
            </DashboardThemeProvider>
          </AppSurface>
        );
      }
    }
  }

  return <SafeAreaProvider>{appContent}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  appContent: {
    flex: 1,
  },
  fullscreenSafe: {
    flex: 1,
  },
  splashRoot: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  splashStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  splashWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  splashGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 84,
    left: -56,
  },
  splashGlowTwo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: colors.heroGlow,
    bottom: 104,
    right: -34,
  },
  splashGlowThree: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
    top: '38%',
    right: '18%',
  },
  splashCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderInverse,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    minWidth: 260,
    gap: spacing.xs,
    ...shadows.hero,
  },
  splashBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  splashLogo: { width: 66, height: 66, borderRadius: radii.lg },
  splashPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  splashPillText: {
    color: colors.textInverseSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  splashTitle: {
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  splashSub: {
    color: colors.textInverseSoft,
    marginTop: spacing.xxs,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  splashMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  splashMetaChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  splashMetaText: {
    color: colors.textInverseSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  centerCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.xs,
    ...shadows.card,
  },
  title: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
