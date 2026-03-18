-- SignupSmartly: Stage 2 RLS policies
-- Purpose: eliminate Security Advisor warnings by enabling RLS and adding explicit policies.
--
-- Rollout safety:
-- - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your server environment (Vercel).
-- - Public browsing and volunteer signup flows rely on service-role server DB access.
-- - Apply this script in Supabase SQL editor (or via migration tooling).

BEGIN;

-- ============ users ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;

CREATE POLICY users_select_own
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY users_insert_own
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ organizations ============
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizations_select_member ON organizations;
DROP POLICY IF EXISTS organizations_insert_any_authenticated ON organizations;

CREATE POLICY organizations_select_member
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY organizations_insert_any_authenticated
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============ organization_members ============
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_select_own ON organization_members;
DROP POLICY IF EXISTS org_members_insert_self ON organization_members;

CREATE POLICY org_members_select_own
ON organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY org_members_insert_self
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============ events ============
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_select_published_or_member ON events;
DROP POLICY IF EXISTS events_insert_owner_organizer ON events;
DROP POLICY IF EXISTS events_update_owner_organizer ON events;

CREATE POLICY events_select_published_or_member
ON events
FOR SELECT
TO anon
USING (published = true);

CREATE POLICY events_select_member
ON events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY events_insert_owner_organizer
ON events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

CREATE POLICY events_update_owner_organizer
ON events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

-- ============ slots ============
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slots_select_published ON slots;
DROP POLICY IF EXISTS slots_select_member ON slots;
DROP POLICY IF EXISTS slots_insert_owner_organizer ON slots;
DROP POLICY IF EXISTS slots_update_owner_organizer ON slots;

CREATE POLICY slots_select_published
ON slots
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = slots.event_id
      AND e.published = true
  )
);

CREATE POLICY slots_select_member
ON slots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE e.id = slots.event_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY slots_insert_owner_organizer
ON slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE e.id = slots.event_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

CREATE POLICY slots_update_owner_organizer
ON slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE e.id = slots.event_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE e.id = slots.event_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

-- ============ signups ============
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS signups_select_member ON signups;
DROP POLICY IF EXISTS signups_insert_owner_organizer ON signups;

-- Public (anon) signups are denied at the row level to prevent sensitive fields
-- (email, comment, cancel_token) from being exposed via direct queries.
--
-- Public pages still work because the app uses server-side service role access.

CREATE POLICY signups_select_member
ON signups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM slots s
    JOIN events e
      ON e.id = s.event_id
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE s.id = signups.slot_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY signups_insert_owner_organizer
ON signups
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM slots s
    JOIN events e
      ON e.id = s.event_id
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE s.id = signups.slot_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

-- ============ nps_responses ============
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nps_select_own ON nps_responses;
DROP POLICY IF EXISTS nps_insert_own ON nps_responses;
DROP POLICY IF EXISTS nps_update_own ON nps_responses;

CREATE POLICY nps_select_own
ON nps_responses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY nps_insert_own
ON nps_responses
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY nps_update_own
ON nps_responses
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============ organizer_notification_digest ============
ALTER TABLE organizer_notification_digest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizer_digest_select_own ON organizer_notification_digest;
DROP POLICY IF EXISTS organizer_digest_update_own ON organizer_notification_digest;
DROP POLICY IF EXISTS organizer_digest_insert_own ON organizer_notification_digest;

CREATE POLICY organizer_digest_select_own
ON organizer_notification_digest
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY organizer_digest_insert_own
ON organizer_notification_digest
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY organizer_digest_update_own
ON organizer_notification_digest
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============ templates ============
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS templates_select_member ON templates;
DROP POLICY IF EXISTS templates_insert_owner_organizer ON templates;
DROP POLICY IF EXISTS templates_update_owner_organizer ON templates;

CREATE POLICY templates_select_member
ON templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = templates.organization_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY templates_insert_owner_organizer
ON templates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = templates.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

CREATE POLICY templates_update_owner_organizer
ON templates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = templates.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = templates.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

-- ============ template_slots ============
ALTER TABLE template_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS template_slots_select_member ON template_slots;
DROP POLICY IF EXISTS template_slots_insert_owner_organizer ON template_slots;
DROP POLICY IF EXISTS template_slots_update_owner_organizer ON template_slots;

CREATE POLICY template_slots_select_member
ON template_slots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM templates t
    JOIN organization_members om
      ON om.organization_id = t.organization_id
    WHERE t.id = template_slots.template_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY template_slots_insert_owner_organizer
ON template_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM templates t
    JOIN organization_members om
      ON om.organization_id = t.organization_id
    WHERE t.id = template_slots.template_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

CREATE POLICY template_slots_update_owner_organizer
ON template_slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM templates t
    JOIN organization_members om
      ON om.organization_id = t.organization_id
    WHERE t.id = template_slots.template_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM templates t
    JOIN organization_members om
      ON om.organization_id = t.organization_id
    WHERE t.id = template_slots.template_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'organizer')
  )
);

COMMIT;

