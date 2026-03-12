-- Make end_date optional (single-day events)
ALTER TABLE events
  ALTER COLUMN end_date DROP NOT NULL;

-- Make slot start_time and end_time optional (e.g. "volunteer for duration")
ALTER TABLE slots
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL;
