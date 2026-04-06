ALTER TABLE events
  ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{"colorKey":"default","fontKey":"quicksand"}'::jsonb;

UPDATE events
SET theme = '{"colorKey":"default","fontKey":"quicksand"}'::jsonb
WHERE theme IS NULL;
