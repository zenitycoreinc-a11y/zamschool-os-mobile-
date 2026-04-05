import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarCircle } from './AvatarCircle';
import { colors, getRolePalette, radii, shadows, spacing } from '../../theme';
import { useDashboardTheme } from '../../dashboardTheme';

export function PremiumSidebar({
  visible,
  onClose,
  role = 'student',
  profile,
  items = [],
  activeKey,
  onSelect,
  onSignOut,
}) {
  const palette = getRolePalette(role);
  const insets = useSafeAreaInsets();
  const { theme } = useDashboardTheme();

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.colors.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderRightColor: theme.colors.border,
              paddingTop: Math.max(insets.top + spacing.sm, spacing.xl),
              paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg),
            },
          ]}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: theme.mode === 'midnight' ? theme.colors.surface : palette.accentSoft,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AvatarCircle
                name={profile?.fullName || 'User'}
                avatarUrl={profile?.avatarUrl || null}
                size={56}
                color="#FFFFFF"
              />
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: theme.colors.textStrong }]}>{profile?.fullName || 'User'}</Text>
                <Text style={[styles.profileMeta, { color: theme.colors.textSoft }]} numberOfLines={1}>
                  {profile?.className || profile?.email || 'Connected account'}
                </Text>
              </View>
            </View>

            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: theme.colors.muted }]}>Navigate</Text>
              {items.map((item) => {
                const active = item.key === activeKey;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onSelect?.(item.key)}
                    style={[
                      styles.item,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                      active
                        ? [
                            styles.itemActive,
                            {
                              backgroundColor: theme.mode === 'midnight' ? theme.colors.surfaceMuted : palette.accentSoft,
                              borderColor: theme.mode === 'midnight' ? theme.colors.borderStrong : 'transparent',
                            },
                          ]
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: theme.colors.surfaceMuted },
                        active
                          ? {
                              backgroundColor: theme.mode === 'midnight' ? theme.colors.buttonStrong : '#FFFFFF',
                            }
                          : null,
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={17}
                        color={
                          active
                            ? palette.accent
                            : theme.mode === 'midnight'
                              ? theme.colors.mutedSoft
                              : colors.textSoft
                        }
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          styles.itemLabel,
                          { color: theme.colors.textStrong },
                          active ? { color: theme.mode === 'midnight' ? theme.colors.textStrong : palette.accentStrong } : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={[styles.itemDescription, { color: theme.colors.muted }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.signOut,
                {
                  borderColor: theme.mode === 'midnight' ? 'rgba(248, 113, 113, 0.32)' : '#F2C7C7',
                  backgroundColor: theme.mode === 'midnight' ? 'rgba(127, 29, 29, 0.22)' : '#FFF3F3',
                },
              ]}
              onPress={onSignOut}
            >
              <Feather name="log-out" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: colors.overlayStrong,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '82%',
    maxWidth: 332,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderTopRightRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    ...shadows.floating,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  profileMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  group: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  groupLabel: {
    marginBottom: spacing.xs,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  itemActive: {
    borderColor: 'transparent',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemDescription: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#F2C7C7',
    backgroundColor: '#FFF3F3',
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
