-- Extend volunteer reminder timing: 1 week and 3 days before

ALTER TABLE signups DROP CONSTRAINT IF EXISTS signups_reminder_offset_check;

ALTER TABLE signups ADD CONSTRAINT signups_reminder_offset_check
  CHECK (reminder_offset IN (
    '1_day',
    'morning_of',
    '1_hour',
    '1_week',
    '3_days'
  ));
