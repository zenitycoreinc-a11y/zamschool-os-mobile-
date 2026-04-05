import { AccountProfileView } from '../../components/shared/AccountProfileView';
import { getRoleAccessSummary, getRoleModuleEntries, getRolePolicy } from '../../config/roleCapabilities';

export function TeacherProfileScreen({ profile, onSignedOut, onProfileUpdated, onNavigate }) {
  const policy = getRolePolicy('teacher');
  const accessSummary = getRoleAccessSummary('teacher');
  const modules = getRoleModuleEntries('teacher').filter((entry) => entry.access !== 'none');

  return (
    <AccountProfileView
      profile={profile}
      roleLabel={profile?.roleLabel || 'Teacher'}
      roleIcon="book-open"
      summaryChips={[
        profile?.statusLabel || 'Active',
        profile?.phone || 'Phone pending',
        `${accessSummary.percent}% access`,
      ]}
      infoItems={[
        { label: 'Email', value: profile?.email || 'Not set', icon: 'mail' },
        { label: 'Phone', value: profile?.phone || 'Not set', icon: 'phone' },
        { label: 'Role', value: profile?.roleLabel || 'Teacher', icon: 'book-open' },
        { label: 'Status', value: profile?.statusLabel || 'Active', icon: 'activity' },
      ]}
      extraSections={[
        {
          title: 'Mission',
          rows: [{ label: 'Focus', value: policy.mission }],
        },
        {
          title: 'Access',
          rows: modules.slice(0, 6).map((module) => ({
            label: module.label,
            value: module.accessLabel,
          })),
        },
      ]}
      accountItems={[
        {
          icon: 'bell',
          label: 'Notifications',
          sub: 'Review classroom and school alerts',
          action: 'notifications',
        },
        {
          icon: 'lock',
          label: 'Change Password',
          sub: 'Send a secure reset link to your email',
          action: 'password',
        },
        {
          icon: 'image',
          label: 'Upload Photo',
          sub: 'Keep your teaching profile current',
          action: 'photo',
        },
      ]}
      aboutText="Teacher mobile workspace"
      onNavigate={onNavigate}
      onProfileUpdated={onProfileUpdated}
      onSignedOut={onSignedOut}
    />
  );
}
