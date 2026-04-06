-- Public signup visibility (who's signed up) + optional public comments per slot.
-- Safe to run if comment_label / comment_required already exist from a manual migration.

ALTER TABLE events ADD COLUMN IF NOT EXISTS show_signups boolean NOT NULL DEFAULT true;

ALTER TABLE slots ADD COLUMN IF NOT EXISTS comment_show_publicly boolean NOT NULL DEFAULT false;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS comment_label text NOT NULL DEFAULT 'Comment';
ALTER TABLE slots ADD COLUMN IF NOT EXISTS comment_required boolean NOT NULL DEFAULT false;
