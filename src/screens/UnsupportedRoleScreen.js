import { Text, View, StyleSheet } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { EmptyState } from '../components/ui/EmptyState';
import { signOut } from '../services/authService';
import { colors, radii, shadows } from '../theme';

export function UnsupportedRoleScreen({ profile, onSignedOut }) {
  const roleLabel = profile?.role || 'unknown';

  async function handleSignOut() {
    await signOut();
    onSignedOut?.();
  }

  return (
    <AppLayout
      title="Access limited"
      subtitle="This app currently supports admin, teacher, student, parent, and payments roles."
    >
      <View style={styles.card}>
        <EmptyState
          icon="shield-off"
          title="Access limited"
          message={`Signed in as: ${profile?.email || profile?.fullName || 'unknown user'}\nDetected role: ${roleLabel}\nSign out and ask your school admin to review this account.`}
          supportingTone="info"
          actionLabel="Sign out"
          onAction={handleSignOut}
        />
        <View style={styles.detailBox}>
          <Text style={styles.text}>If this role is wrong, the school admin can update the account setup and restore access.</Text>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
  detailBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  text: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
