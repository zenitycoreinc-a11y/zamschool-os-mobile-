import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

export function Card({ title, children }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
