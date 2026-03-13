-- Add signup_type to events: 'scheduled' or 'simple'
ALTER TABLE events
  ADD COLUMN signup_type TEXT NOT NULL DEFAULT 'scheduled'
  CHECK (signup_type IN ('scheduled', 'simple'));

-- Simple list events may have no dates
ALTER TABLE events
  ALTER COLUMN start_date DROP NOT NULL;
