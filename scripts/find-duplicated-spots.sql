-- Read-only: finds signups whose spots were stacked by the draft re-save bug
-- (the same spot name + date/time appearing more than once on one event).
-- Run in Supabase Dashboard -> SQL Editor (production). Changes nothing.
select
  e.id,
  e.title,
  e.published,
  u.email as organizer,
  count(*) as duplicated_spot_rows,
  sum(dup.copies) as total_copies
from (
  select event_id, role_name, start_time, end_time, count(*) as copies
  from slots
  group by event_id, role_name, start_time, end_time
  having count(*) > 1
) dup
join events e on e.id = dup.event_id
left join auth.users u on u.id = e.created_by
where e.archived = false
group by e.id, e.title, e.published, u.email
order by e.created_at desc;
