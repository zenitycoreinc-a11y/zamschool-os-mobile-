import { StyleSheet, Text, View } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { colors, spacing } from '../theme';
import { Button } from '../components/Button';
import { signOut } from '../services/authService';
import { getRolePolicy } from '../config/roleCapabilities';

export function PaymentsShellScreen({ profile, onSignedOut }) {
  const paymentsPolicy = getRolePolicy('payments');

  async function handleSignOut() {
    await signOut();
    onSignedOut?.();
  }

  return (
    <AppLayout
      title="Payments Workspace"
      subtitle="Track collections, references, and school finance activity from the same Supabase-backed role model as the webapp."
      rightSlot={<Button label="Sign out" variant="secondary" onPress={handleSignOut} />}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Signed in</Text>
        <Text style={styles.text}>{profile?.email || 'Unknown payments user'}</Text>
        <Text style={styles.meta}>Role: {profile?.role || 'payments'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Finance scope</Text>
        <Text style={styles.text}>This mobile role is marked {paymentsPolicy.previewState} while preview scope is frozen.</Text>
        <Text style={styles.meta}>Use the web dashboard for full finance operations while this mobile shell stays explicitly incomplete.</Text>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
});
