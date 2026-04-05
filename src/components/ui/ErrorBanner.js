import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

const toneStyles = {
  danger: {
    icon: colors.dangerStrong,
    title: colors.dangerStrong,
    message: colors.dangerStrong,
    border: colors.dangerSoft,
    background: '#FFF7F7',
    retryBg: colors.dangerStrong,
    retryText: colors.textInverse,
  },
  warning: {
    icon: colors.warningStrong,
    title: colors.warningStrong,
    message: colors.warningStrong,
    border: '#F7E3C7',
    background: '#FFFBF3',
    retryBg: colors.warningStrong,
    retryText: colors.textInverse,
  },
  info: {
    icon: colors.infoStrong,
    title: colors.infoStrong,
    message: colors.textSoft,
    border: colors.infoSoft,
    background: colors.surfaceRaised,
    retryBg: colors.infoStrong,
    retryText: colors.textInverse,
  },
};

export function ErrorBanner({
  message = 'Something went wrong.',
  onRetry,
  supportingTone = 'danger',
  retryLabel = 'Try again',
  title = 'We hit a snag',
}) {
  const tone = toneStyles[supportingTone] || toneStyles.danger;

  return (
    <View style={[styles.wrap, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: tone.background }]}>
          <Feather name="alert-circle" size={16} color={tone.icon} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: tone.title }]}>{title}</Text>
          <Text style={[styles.text, { color: tone.message }]}>{message}</Text>
        </View>
      </View>
      {onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retry, { backgroundColor: tone.retryBg }, pressed ? styles.retryPressed : null]}>
          <Text style={[styles.retryText, { color: tone.retryText }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: 10,
    ...shadows.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    lineHeight: 18,
  },
  retry: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryPressed: {
    opacity: 0.9,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
