import { z } from 'zod';

/** Values allowed in DB (`signups.reminder_offset` CHECK). */
export type ReminderOffset =
  | '1_week'
  | '3_days'
  | '1_day'
  | 'morning_of'
  | '1_hour';

/** Volunteer-facing options (dropdown order). */
export const VOLUNTEER_REMINDER_OFFSET_VALUES = [
  '1_week',
  '3_days',
  '1_day',
  'morning_of',
] as const satisfies readonly ReminderOffset[];

export type VolunteerReminderOffset =
  (typeof VOLUNTEER_REMINDER_OFFSET_VALUES)[number];

export const volunteerReminderOffsetZod = z.enum([
  '1_week',
  '3_days',
  '1_day',
  'morning_of',
]);

/** PATCH preferences: any value the DB allows (includes legacy `1_hour`). */
export const reminderOffsetDbZod = z.enum([
  '1_week',
  '3_days',
  '1_day',
  'morning_of',
  '1_hour',
]);

export const REMINDER_OFFSET_LABELS: Record<VolunteerReminderOffset, string> = {
  '1_week': '1 week before',
  '3_days': '3 days before',
  '1_day': '1 day before',
  morning_of: 'Morning of the event',
};
