-- Add source to signups (volunteer | organizer); email optional for organizer
ALTER TABLE signups
  ADD COLUMN source TEXT NOT NULL DEFAULT 'volunteer' CHECK (source IN ('volunteer', 'organizer'));

ALTER TABLE signups
  ALTER COLUMN email DROP NOT NULL;
