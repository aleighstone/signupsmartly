-- Allow null end_date for simple list events (optional date)
ALTER TABLE events
  ALTER COLUMN end_date DROP NOT NULL;

-- Allow null start_time/end_time for simple list slots (no time slots)
ALTER TABLE slots
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE slots
  ALTER COLUMN end_time DROP NOT NULL;
