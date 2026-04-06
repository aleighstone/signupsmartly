-- Prevent duplicate active volunteer signups for the same email on the same slot
-- (double-click / parallel requests). Fails if duplicate rows already exist — remove
-- duplicates in signups first, then run this migration.
CREATE UNIQUE INDEX IF NOT EXISTS signups_unique_slot_active_lower_email
ON signups (slot_id, lower(trim(email)))
WHERE cancelled = false;
