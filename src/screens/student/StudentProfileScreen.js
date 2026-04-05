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
import { AvatarCircle } from '../../components/shared/AvatarCircle';
import { resetPasswordForEmail, signOut } from '../../services/authService';
import {
  getNotificationPermissionState,
  openNotificationSettings,
  requestNotificationPermission,
} from '../../services/notificationPermissions.js';
import { uploadMyProfileAvatar } from '../../services/profileService';
import { colors, radii, shadows, spacing } from '../../theme';

function fullName(value) {
  if (!value) return 'Student';
  return String(value).trim();
}

function InfoChip({ label }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText} numberOfLines={1}>
        {label}
      </Text>
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

export function StudentProfileScreen({ profile, onSignedOut, onProfileUpdated, onNavigate }) {
  const name = fullName(profile?.fullName);
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

  const profileItems = useMemo(
    () => [
      { label: 'Email', value: profile?.email, icon: 'mail' },
      { label: 'Admission Number', value: profile?.admissionNumber || 'Not assigned', icon: 'hash' },
      { label: 'Class', value: profile?.className || 'Not assigned', icon: 'layers' },
      { label: 'Grade', value: profile?.gradeLabel || 'Not assigned', icon: 'book-open' },
      { label: 'Role', value: 'Student', icon: 'book' },
    ],
    [profile?.admissionNumber, profile?.className, profile?.email, profile?.gradeLabel]
  );

  const accountItems = useMemo(
    () => [
      {
        icon: 'bell',
        label: 'Notifications',
        sub: 'Manage notification preferences',
        action: 'notifications',
      },
      {
        icon: 'lock',
        label: 'Change Password',
        sub: 'Update your account password',
        action: 'password',
      },
      {
        icon: 'info',
        label: 'About ZAM School OS',
        sub: 'Version 1.0.0',
        action: 'about',
      },
    ],
    []
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          onSignedOut?.();
        },
      },
    ]);
  };

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
      if (asset.fileSize && asset.fileSize > 4 * 1024 * 1024) {
        Alert.alert('Image too large', 'Choose a smaller photo so the upload stays fast and reliable.');
        return;
      }
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onProfileUpdated?.({ avatarUrl: nextAvatarUrl });
      Alert.alert('Profile updated', 'Your profile photo has been updated.');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload failed', error?.message || 'Unable to upload your profile photo right now.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAccountAction = async (action) => {
    if (action === 'notifications') {
      onNavigate?.('notifications');
      return;
    }

    if (action === 'password') {
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

    if (action === 'about') {
      Alert.alert('About ZAM School OS', 'Student mobile workspace\nVersion 1.0.0');
    }
  };

  const notificationPermissionMeta = getNotificationPermissionMeta(notificationPermission);

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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <AvatarCircle name={name} avatarUrl={avatarUrl} size={88} color={colors.textInverse} />

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.email} numberOfLines={2}>
              {profile?.email || 'Not provided'}
            </Text>
          </View>
        </View>

        <View style={styles.infoChipRow}>
          <InfoChip label={profile?.admissionNumber || 'Admission pending'} />
          <InfoChip label={profile?.className || 'Class pending'} />
          <InfoChip label={profile?.gradeLabel || 'Grade pending'} />
        </View>

        <View style={styles.heroActions}>
          <View style={styles.roleBadge}>
            <Feather name="book" size={12} color={colors.primaryStrong} />
            <Text style={styles.roleText}>Student</Text>
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
          {profileItems.map((item, idx) => (
            <View
              key={item.label}
              style={[styles.infoRow, idx < profileItems.length - 1 ? styles.infoRowBorder : null]}
            >
              <View style={styles.infoIconWrap}>
                <Feather name={item.icon} size={16} color={colors.primaryStrong} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification permissions</Text>
        <View style={styles.card}>
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
          {accountItems.map((item, idx) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuRow,
                idx < accountItems.length - 1 ? styles.menuRowBorder : null,
                pressed ? styles.menuRowPressed : null,
              ]}
              onPress={() => handleAccountAction(item.action)}
            >
              <View style={styles.menuIconWrap}>
                <Feather name={item.icon} size={18} color={colors.textSoft} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>
                  {item.action === 'password' && isSendingReset ? 'Sending reset email...' : item.sub}
                </Text>
              </View>
              {item.action === 'password' && isSendingReset ? (
                <ActivityIndicator size="small" color={colors.primaryStrong} />
              ) : (
                <Feather name="chevron-right" size={18} color={colors.borderStrong} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : null]}
        onPress={handleLogout}
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
    letterSpacing: -0.2,
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
    maxWidth: '100%',
  },
  infoChipText: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryStrong,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  photoButtonPressed: {
    opacity: 0.84,
  },
  photoButtonText: {
    color: colors.primaryStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    marginTop: 2,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
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
    opacity: 0.84,
  },
  permissionButtonText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  menuSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textSoft,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(200, 58, 58, 0.18)',
    padding: spacing.md,
  },
  logoutButtonPressed: {
    opacity: 0.84,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
  },
});
