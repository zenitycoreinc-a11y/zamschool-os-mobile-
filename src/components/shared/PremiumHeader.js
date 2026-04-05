import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getRolePalette, radii, shadows, spacing } from '../../theme';
import { useDashboardTheme } from '../../dashboardTheme';

export function PremiumHeader({ role = 'student', title, subtitle, profile, onMenuPress, rightSlot }) {
  const insets = useSafeAreaInsets();
  const palette = getRolePalette(role);
  const { theme } = useDashboardTheme();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Pressable
            style={[
              styles.menuButton,
              {
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={onMenuPress}
          >
            <View style={[styles.menuAccent, { backgroundColor: palette.accentSoft }]}>
              <Feather name="menu" size={18} color={palette.accent} />
            </View>
          </Pressable>

          <View style={styles.textWrap}>
            <Text style={[styles.eyebrow, { color: theme.colors.muted }]}>ZAM School OS</Text>
            <Text style={[styles.title, { color: theme.colors.textStrong }]} numberOfLines={1}>
              {title || profile?.fullName || 'Workspace'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSoft }]} numberOfLines={1}>
              {subtitle || profile?.className || profile?.email || 'Connected to your school workspace'}
            </Text>
          </View>

          {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  card: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  menuAccent: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
  },
  rightSlot: {
    marginLeft: spacing.xs,
  },
});
