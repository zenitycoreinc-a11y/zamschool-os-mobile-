import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

const toneStyles = {
  calm: {
    iconBg: colors.surfaceMuted,
    iconColor: colors.muted,
    wrapBg: colors.surfaceMuted,
    title: colors.text,
    message: colors.textSoft,
    border: colors.border,
    accent: colors.primary,
  },
  info: {
    iconBg: colors.infoSoft,
    iconColor: colors.infoStrong,
    wrapBg: colors.surfaceRaised,
    title: colors.textStrong,
    message: colors.textSoft,
    border: colors.border,
    accent: colors.infoStrong,
  },
  celebratory: {
    iconBg: colors.primarySoft,
    iconColor: colors.primaryStrong,
    wrapBg: colors.surfaceRaised,
    title: colors.textStrong,
    message: colors.textSoft,
    border: colors.border,
    accent: colors.primaryStrong,
  },
};

export function EmptyState({
  icon = 'info',
  title,
  message,
  actionLabel,
  onAction,
  supportingTone = 'calm',
  tone,
}) {
  const activeTone = toneStyles[tone || supportingTone] || toneStyles.calm;

  return (
    <View style={[styles.wrap, { backgroundColor: activeTone.wrapBg, borderColor: activeTone.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: activeTone.iconBg }]}>
        <Feather name={icon} size={20} color={activeTone.iconColor} />
      </View>
      <Text style={[styles.title, { color: activeTone.title }]}>{title}</Text>
      <Text style={[styles.message, { color: activeTone.message }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}>
          <Text style={[styles.actionText, { color: activeTone.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  action: {
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionPressed: {
    opacity: 0.9,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
