import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AvatarCircle } from './AvatarCircle';
import { ErrorBanner } from '../ui/ErrorBanner';
import { resetPasswordForEmail, signOut } from '../../services/authService';
import {
  getNotificationPermissionState,
  openNotificationSettings,
  requestNotificationPermission,
} from '../../services/notificationPermissions.js';
import { uploadMyProfileAvatar } from '../../services/profileService';
import { colors, radii, shadows, spacing } from '../../theme';

function InfoChip({ label }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function InfoRow({ item, last = false }) {
  return (
    <View style={[styles.infoRow, !last ? styles.infoRowBorder : null]}>
      <View style={styles.infoIconWrap}>
        <Feather name={item.icon || 'circle'} size={16} color={colors.primaryStrong} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{item.label}</Text>
        <Text style={styles.infoValue}>{item.value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ item, onPress, isBusy = false, last = false }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        !last ? styles.menuRowBorder : null,
        pressed ? styles.menuRowPressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuIconWrap}>
        <Feather name={item.icon} size={18} color={colors.textSoft} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <Text style={styles.menuSub}>{item.sub}</Text>
      </View>
      {isBusy ? (
        <ActivityIndicator size="small" color={colors.primaryStrong} />
      ) : (
        <Feather name="chevron-right" size={18} color={colors.borderStrong} />
      )}
    </Pressable>
  );
}

function ExtraSection({ title, rows = [] }) {
  if (!rows.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View
            key={`${title}-${row.label}`}
            style={[styles.infoRow, index < rows.length - 1 ? styles.infoRowBorder : null]}
          >
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function getNotificationPermissionMeta(permissionState) {
  if (permissionState?.status === 'granted') {
    return {
      label: 'Enabled',
      note: 'School alerts can appear on this device.',
      actionLabel: 'Enabled',
      actionable: false,
    };
  }

  if (permissionState?.status === 'unavailable') {
    return {
      label: 'Unavailable',
      note: 'This build does not include notification support yet. Install the latest dev build to enable alerts.',
      actionLabel: 'Rebuild Required',
      actionable: false,
    };
  }

  if (permissionState?.status === 'blocked') {
    return {
      label: 'Blocked',
      note: 'Notifications are blocked at the device level. Open settings to allow them.',
      actionLabel: 'Open Settings',
      actionable: true,
    };
  }

  return {
    label: 'Not enabled',
    note: 'Allow notifications for messages, attendance, and school notices.',
    actionLabel: 'Enable',
    actionable: true,
  };
}

function getNotificationCommandCenterChips(permissionState) {
  if (permissionState?.status === 'granted') {
    return ['Permission enabled', 'Live alerts ready', 'Device connected'];
  }

  if (permissionState?.status === 'blocked') {
    return ['Permission blocked', 'Open settings', 'Delivery paused'];
  }

  if (permissionState?.status === 'unavailable') {
    return ['Native module missing', 'Reinstall the latest build', 'Delivery paused'];
  }

  return ['Permission pending', 'Messages, attendance, and school notices', 'Turn alerts on'];
}

export function AccountProfileView({
  profile,
  roleLabel,
  roleIcon,
  summaryChips = [],
  infoItems = [],
  extraSections = [],
  accountItems = [],
  aboutText = '',
  errorMessage = '',
  onRetry = null,
  onNavigate = null,
  onProfileUpdated = null,
  onSignedOut = null,
}) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || null);

  useEffect(() => {
    setAvatarUrl(profile?.avatarUrl || null);
  }, [profile?.avatarUrl]);

  useEffect(() => {
    let active = true;

    async function loadNotificationPermission() {
      try {
        const nextPermission = await getNotificationPermissionState();
        if (active) {
          setNotificationPermission(nextPermission);
        }
      } catch {
        if (active) {
          setNotificationPermission({
            status: 'undetermined',
            granted: false,
            canAskAgain: true,
            systemStatus: 'undetermined',
            shouldOpenSettings: false,
          });
        }
      }
    }

    loadNotificationPermission();

    return () => {
      active = false;
    };
  }, []);

  const mergedAccountItems = useMemo(
    () =>
      accountItems.map((item) => ({
        ...item,
        sub:
          item.action === 'password' && isSendingReset
            ? 'Sending reset email...'
            : item.sub,
      })),
    [accountItems, isSendingReset]
  );

  const handleAvatarUpload = async () => {
    if (isUploadingAvatar) return;

    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.granted !== true) {
          Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Upload failed', 'The selected image could not be prepared for upload.');
        return;
      }

      setIsUploadingAvatar(true);
      const nextAvatarUrl = await uploadMyProfileAvatar({
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      });

      if (!nextAvatarUrl) {
        throw new Error('Avatar upload did not return a photo URL.');
      }

      setAvatarUrl(nextAvatarUrl);
      onProfileUpdated?.({ avatarUrl: nextAvatarUrl });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Profile updated', 'Your profile photo has been updated.');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload failed', error?.message || 'Unable to upload your profile photo right now.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAccountAction = async (item) => {
    if (item.action === 'notifications') {
      onNavigate?.('notifications');
      return;
    }

    if (item.action === 'password') {
      if (isSendingReset) return;
      if (!profile?.email) {
        Alert.alert('Password reset unavailable', 'This account does not have an email address saved yet.');
        return;
      }

      try {
        setIsSendingReset(true);
        await resetPasswordForEmail(profile.email);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Reset email sent', `A password reset link was sent to ${profile.email}.`);
      } catch (error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Reset failed', error?.message || 'Unable to send the password reset email right now.');
      } finally {
        setIsSendingReset(false);
      }
      return;
    }

    if (item.action === 'about') {
      Alert.alert(`About ${roleLabel}`, aboutText || `${roleLabel} mobile workspace`);
      return;
    }

    if (item.action === 'photo') {
      await handleAvatarUpload();
      return;
    }

    await item.onPress?.();
  };

  const notificationPermissionMeta = getNotificationPermissionMeta(notificationPermission);
  const notificationCommandCenterChips = getNotificationCommandCenterChips(notificationPermission);

  const handleNotificationPermissionAction = async () => {
    if (isUpdatingNotifications || !notificationPermissionMeta.actionable) {
      return;
    }

    try {
      setIsUpdatingNotifications(true);

      if (notificationPermission?.status === 'blocked') {
        const opened = await openNotificationSettings();
        if (!opened) {
          throw new Error('Unable to open app settings on this device.');
        }
        return;
      }

      const nextPermission = await requestNotificationPermission();
      setNotificationPermission(nextPermission);

      if (nextPermission.status === 'granted') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Notifications enabled', 'You will now receive school alerts on this device.');
        return;
      }

      if (nextPermission.status === 'blocked') {
        Alert.alert(
          'Enable in settings',
          'Notifications are blocked for this app. Open device settings to allow them.'
        );
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Notifications unavailable', error?.message || 'Unable to update notification permissions right now.');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={onRetry || undefined} /> : null}

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <AvatarCircle
            name={profile?.fullName || roleLabel}
            avatarUrl={avatarUrl}
            size={88}
            color={colors.textInverse}
          />

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.fullName || roleLabel}
            </Text>
            <Text style={styles.email} numberOfLines={2}>
              {profile?.email || 'Not provided'}
            </Text>
          </View>
        </View>

        <View style={styles.infoChipRow}>
          {summaryChips.map((chip) => (
            <InfoChip key={chip} label={chip} />
          ))}
        </View>

        <View style={styles.heroActions}>
          <View style={styles.roleBadge}>
            <Feather name={roleIcon} size={12} color={colors.primaryStrong} />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.photoButton,
              pressed || isUploadingAvatar ? styles.photoButtonPressed : null,
            ]}
            onPress={handleAvatarUpload}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.primaryStrong} />
            ) : (
              <Feather name={avatarUrl ? 'image' : 'upload'} size={16} color={colors.primaryStrong} />
            )}
            <Text style={styles.photoButtonText}>
              {isUploadingAvatar ? 'Uploading...' : avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal information</Text>
        <View style={styles.card}>
          {infoItems.map((item, index) => (
            <InfoRow key={item.label} item={item} last={index === infoItems.length - 1} />
          ))}
        </View>
      </View>

      {extraSections.map((section) => (
        <ExtraSection key={section.title} title={section.title} rows={section.rows} />
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification permissions</Text>
        <View style={styles.card}>
          <View style={styles.commandCenterHeader}>
            <View style={styles.commandCenterCopy}>
              <Text style={styles.commandCenterEyebrow}>Notification Command Center</Text>
              <Text style={styles.commandCenterTitle}>Messages, attendance, and school notices</Text>
              <Text style={styles.commandCenterSummary}>
                Keep this device ready for the updates that matter most to this account.
              </Text>
            </View>
            <View
              style={[
                styles.commandCenterStatusChip,
                notificationPermissionMeta.actionable ? null : styles.commandCenterStatusChipReady,
              ]}
            >
              <Text
                style={[
                  styles.commandCenterStatusText,
                  notificationPermissionMeta.actionable ? null : styles.commandCenterStatusTextReady,
                ]}
              >
                {notificationPermissionMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.commandCenterChipRow}>
            {notificationCommandCenterChips.map((chip) => (
              <View key={chip} style={styles.commandCenterChip}>
                <Text style={styles.commandCenterChipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.permissionRow}>
            <View style={styles.permissionCopy}>
              <Text style={styles.infoLabel}>App permission</Text>
              <Text style={styles.permissionValue}>{notificationPermissionMeta.label}</Text>
              <Text style={styles.menuSub}>{notificationPermissionMeta.note}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.permissionButton,
                !notificationPermissionMeta.actionable ? styles.permissionButtonDisabled : null,
                pressed && notificationPermissionMeta.actionable ? styles.permissionButtonPressed : null,
              ]}
              onPress={handleNotificationPermissionAction}
              disabled={!notificationPermissionMeta.actionable || isUpdatingNotifications}
            >
              {isUpdatingNotifications ? (
                <ActivityIndicator size="small" color={colors.primaryStrong} />
              ) : (
                <Text style={styles.permissionButtonText}>{notificationPermissionMeta.actionLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {mergedAccountItems.map((item, index) => (
            <MenuRow
              key={item.label}
              item={item}
              onPress={() => handleAccountAction(item)}
              isBusy={item.action === 'password' && isSendingReset}
              last={index === mergedAccountItems.length - 1}
            />
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : null]}
        onPress={async () => {
          await signOut();
          onSignedOut?.();
        }}
      >
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl + 36,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.textSoft,
  },
  infoChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  infoChip: {
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  infoChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  roleText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  photoButtonPressed: {
    opacity: 0.88,
  },
  photoButtonText: {
    color: colors.primaryStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  commandCenterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commandCenterCopy: {
    flex: 1,
    gap: 4,
  },
  commandCenterEyebrow: {
    color: colors.primaryStrong,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  commandCenterTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  commandCenterSummary: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  commandCenterStatusChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  commandCenterStatusChipReady: {
    backgroundColor: colors.successSoft,
  },
  commandCenterStatusText: {
    color: colors.warningStrong,
    fontSize: 11,
    fontWeight: '800',
  },
  commandCenterStatusTextReady: {
    color: colors.successStrong,
  },
  commandCenterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  commandCenterChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  commandCenterChipText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  permissionCopy: {
    flex: 1,
    gap: 4,
  },
  permissionValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  permissionButton: {
    minWidth: 110,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  permissionButtonPressed: {
    opacity: 0.88,
  },
  permissionButtonText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  menuRowPressed: {
    opacity: 0.88,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  menuContent: {
    flex: 1,
    gap: 3,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  menuSub: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  logoutButtonPressed: {
    opacity: 0.88,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
