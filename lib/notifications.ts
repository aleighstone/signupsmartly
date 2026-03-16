import type { Event, User } from '@/types/database';

export type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

export function effectiveNotificationPreference(
  userPreference: NotificationPreference,
  eventOverride: NotificationPreference | null
): NotificationPreference {
  return eventOverride ?? userPreference;
}

export function getEventNotificationPreference(params: {
  user: Pick<User, 'notification_preference'>;
  event: Pick<Event, 'notification_override'>;
}): NotificationPreference {
  return effectiveNotificationPreference(
    params.user.notification_preference,
    params.event.notification_override as NotificationPreference | null
  );
}

