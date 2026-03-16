-- Volunteer reminder emails: signups reminder fields

ALTER TABLE signups
  ADD COLUMN reminder_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN reminder_offset text NOT NULL DEFAULT '1_day'
    CHECK (reminder_offset IN ('1_day', 'morning_of', '1_hour')),
  ADD COLUMN reminder_sent_at timestamptz NULL;

