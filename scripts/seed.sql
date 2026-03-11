-- Seed script for SignupSmartly (run after migrations)
-- Creates a demo organization, user placeholder, and sample event

-- Note: For a real seed, you would:
-- 1. Create a user via Supabase Auth first
-- 2. Use that user's ID when inserting into users and organization_members

-- This script creates the structure; replace USER_ID with actual auth user UUID
-- after signing up via the app

-- Example: Create org and event (after you have a user)
/*
INSERT INTO organizations (id, name, timezone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Arcadia Track Club', 'America/Los_Angeles')
ON CONFLICT DO NOTHING;

-- Replace with your auth user ID after signing up
INSERT INTO organization_members (organization_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'YOUR_AUTH_USER_ID', 'owner')
ON CONFLICT DO NOTHING;

INSERT INTO events (organization_id, title, description, location, start_date, end_date, published) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Spring Track Meet #3', 'Annual spring track meet', 'Arcadia High School Track', '2025-05-14T08:00:00Z', '2025-05-14T18:00:00Z', true)
RETURNING id;

-- Use the returned event ID for slots
INSERT INTO slots (event_id, role_name, start_time, end_time, capacity, instructions) VALUES
  ('EVENT_ID', 'Timer', '2025-05-14T10:00:00Z', '2025-05-14T11:00:00Z', 2, 'Time each runner'),
  ('EVENT_ID', 'Lane Judge', '2025-05-14T11:00:00Z', '2025-05-14T12:00:00Z', 2, 'Watch assigned lane'),
  ('EVENT_ID', 'Setup Crew', '2025-05-14T08:00:00Z', '2025-05-14T09:00:00Z', 4, 'Help set up equipment');
*/
