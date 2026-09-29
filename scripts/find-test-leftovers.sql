-- Read-only: lists signups that Playwright test runs likely left behind.
-- Run in Supabase Dashboard -> SQL Editor (production). Changes nothing.
select
  e.id,
  e.title,
  e.published,
  e.created_at::date as created,
  (select count(*) from slots s join signups g on g.slot_id = s.id where s.event_id = e.id) as real_signups
from events e
join auth.users u on u.id = e.created_by
where u.email = 'allisonleighstone@gmail.com'
  and e.archived = false
  and (
    e.title ilike '%playwright%'
    or e.created_at >= '2026-09-26'
  )
order by e.created_at desc;
