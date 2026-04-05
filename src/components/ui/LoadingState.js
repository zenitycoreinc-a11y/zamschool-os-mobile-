import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

export function LoadingState() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primaryStrong} />
        <Text style={styles.title}>Loading…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  card: {
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
