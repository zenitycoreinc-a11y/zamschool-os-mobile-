import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

export function FeedCard({
  leading = null,
  eyebrow = '',
  title,
  message,
  timestamp = '',
  unread = false,
  accessory = null,
  onPress,
  style = null,
}) {
  const content = (
    <>
      {leading ? <View style={styles.leadingWrap}>{leading}</View> : null}
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      {unread ? <View style={styles.unreadDot} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, unread ? styles.unread : null, pressed ? styles.pressed : null, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, unread ? styles.unread : null, style]}>{content}</View>;
}

export function FeedCardIcon({ icon = 'info', color = colors.primaryStrong, backgroundColor = colors.primarySoft }) {
  return (
    <View style={[styles.iconWrap, { backgroundColor }]}>
      <Feather name={icon} size={18} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  unread: {
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  leadingWrap: {
    marginTop: 2,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: colors.primaryStrong,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  message: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  accessory: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
