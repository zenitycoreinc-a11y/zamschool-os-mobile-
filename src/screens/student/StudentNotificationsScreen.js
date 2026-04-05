import { RoleNotificationsScreen } from '../shared/RoleNotificationsScreen';

export function StudentNotificationsScreen() {
  return (
    <RoleNotificationsScreen
      role="student"
      emptyTitle="No notifications"
      emptyMessage="You're all caught up."
      summary="School alerts, teacher updates, and account notices for your student workspace."
    />
  );
}
