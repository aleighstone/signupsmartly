-- Allow owners/organizers to delete slots on their own org's events.
--
-- Production has RLS on `slots` (see supabase/20260318000000_stage2_enable_rls.sql)
-- with SELECT/INSERT/UPDATE policies but no DELETE policy. The create wizard
-- re-saves drafts (Save draft / Preview) by deleting the draft's slots and
-- inserting the new set; without this policy the delete silently matched 0 rows,
-- so every re-save stacked another full set of spots onto the draft.
--
-- Production: run this file in Supabase Dashboard -> SQL Editor.

DROP POLICY IF EXISTS slots_delete_owner_organizer ON slots;

CREATE POLICY slots_delete_owner_organizer
ON slots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN organization_members om
      ON om.organization_id = e.organization_id
    WHERE e.id = slots.event_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'organizer')
  )
);
