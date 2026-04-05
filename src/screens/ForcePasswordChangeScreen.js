import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { completeFirstLoginPasswordChange, normalizeAuthError } from '../services/authService';
import { colors, spacing } from '../theme';

export function ForcePasswordChangeScreen({ profile, onCompleted }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!currentPassword) {
      setError('Enter your current temporary password.');
      return false;
    }
    if (!newPassword) {
      setError('Enter a new password.');
      return false;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the temporary password.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      await completeFirstLoginPasswordChange(currentPassword, newPassword);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onCompleted?.();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(normalizeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout
      title="Change password"
      subtitle="This account started with a temporary password. Set your own password before entering the app."
    >
      <View style={styles.card}>
        <View style={styles.notice}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={styles.noticeText}>Use the current temporary password to confirm the account.</Text>
        </View>

        <Field
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrentPassword}
          toggleLabel={showCurrentPassword ? 'Hide' : 'Show'}
          onToggle={() => setShowCurrentPassword((v) => !v)}
        />

        <Field
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          toggleLabel={showNewPassword ? 'Hide' : 'Show'}
          onToggle={() => setShowNewPassword((v) => !v)}
        />

        <Field
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          toggleLabel={showConfirmPassword ? 'Hide' : 'Show'}
          onToggle={() => setShowConfirmPassword((v) => !v)}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label={isLoading ? 'Updating...' : 'Change password'} onPress={handleSubmit} disabled={isLoading} />
      </View>
    </AppLayout>
  );
}

function Field({ label, value, onChangeText, secureTextEntry, toggleLabel, onToggle }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          placeholder={label}
          placeholderTextColor={colors.muted}
        />
        <Pressable onPress={onToggle} hitSlop={8}>
          <Text style={styles.toggle}>{toggleLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.panelAlt,
    borderRadius: 12,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    color: colors.slate700,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
    fontSize: 15,
  },
  toggle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
});
