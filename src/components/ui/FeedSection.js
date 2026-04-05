import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

export function FeedSection({ title, action = '', onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {action ? (
          onAction ? (
            <Pressable onPress={onAction} hitSlop={8}>
              <Text style={styles.action}>{action}</Text>
            </Pressable>
          ) : (
            <Text style={styles.action}>{action}</Text>
          )
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  action: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    gap: spacing.sm,
  },
});
