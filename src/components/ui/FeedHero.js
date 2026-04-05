import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

export function FeedHero({ title, summary, chips = [], meta = null, accent = colors.primary, accentSoft = colors.primarySoft }) {
  return (
    <LinearGradient
      colors={[accentSoft, colors.surfaceRaised, colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={[styles.glow, { backgroundColor: accentSoft }]} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.textStrong }]}>{title}</Text>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        {chips.length > 0 ? (
          <View style={styles.chipRow}>
            {chips.map((chip, index) =>
              typeof chip === 'string' ? (
                <View key={`${chip}-${index}`} style={[styles.chip, { backgroundColor: accentSoft }]}>
                  <Text style={[styles.chipText, { color: accent }]}>{chip}</Text>
                </View>
              ) : (
                <View key={index}>{chip}</View>
              )
            )}
          </View>
        ) : null}
      </View>
      {meta ? <View style={styles.meta}>{meta}</View> : null}
    </LinearGradient>
  );
}

export function FeedHeroAction({
  label,
  onPress,
  icon = 'arrow-right',
  accent = colors.primary,
  accentSoft = colors.primarySoft,
}) {
  if (!label) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: accentSoft, borderColor: accent },
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Feather name={icon} size={14} color={accent} />
      <Text style={[styles.actionText, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  glow: {
    position: 'absolute',
    top: -28,
    right: -24,
    width: 110,
    height: 110,
    borderRadius: 999,
    opacity: 0.35,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  summary: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    maxWidth: 320,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  meta: {
    alignSelf: 'flex-start',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
