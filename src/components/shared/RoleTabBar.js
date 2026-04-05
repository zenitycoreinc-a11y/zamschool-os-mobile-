import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme';
import { useDashboardTheme } from '../../dashboardTheme';

export function RoleTabBar({
  bottomTabs = [],
  activeKey,
  onSelect,
  accent = colors.primary,
  accentSoft = 'rgba(31, 77, 143, 0.10)',
  accentStrong = colors.primary,
  style,
}) {
  const { theme } = useDashboardTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          borderColor: theme.colors.borderStrong,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      {bottomTabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect?.(tab.key)}
            style={[
              styles.item,
              active
                ? { backgroundColor: theme.mode === 'midnight' ? theme.colors.surfaceMuted : accentSoft }
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
                name={tab.icon}
                size={18}
                color={active ? accent : theme.mode === 'midnight' ? theme.colors.mutedSoft : colors.textSoft}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: theme.mode === 'midnight' ? theme.colors.mutedSoft : colors.textSoft },
                active
                  ? { color: theme.mode === 'midnight' ? theme.colors.textStrong : accentStrong }
                  : null,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 8,
    ...shadows.floating,
  },
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  label: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
