-- Organizer-defined display order on public signup page (nullable for existing rows).
ALTER TABLE slots ADD COLUMN IF NOT EXISTS sort_order INTEGER;
