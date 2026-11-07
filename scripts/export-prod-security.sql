-- Read-only: prints production's security setup (RLS flags, policies, indexes,
-- functions, triggers) as SQL so local can be brought in line with it.
-- Run in Supabase Dashboard -> SQL Editor (production), then download the
-- results as CSV. Changes nothing.
with items as (
  -- 1. Tables with row-level security turned on
  select 1 as ord, c.relname::text as name,
         format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname) as ddl
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity

  union all
  -- 2. Policies
  select 2, tablename || '.' || policyname,
         format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
                policyname, tablename, permissive, cmd, array_to_string(roles, ', '),
                case when qual is not null then ' USING (' || qual || ')' else '' end,
                case when with_check is not null then ' WITH CHECK (' || with_check || ')' else '' end)
  from pg_policies
  where schemaname = 'public'

  union all
  -- 3. Indexes
  select 3, indexname::text, indexdef || ';'
  from pg_indexes
  where schemaname = 'public'

  union all
  -- 4. Functions
  select 4, p.proname::text, pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'

  union all
  -- 5. Triggers on public tables and auth.users
  select 5, n.nspname || '.' || c.relname || '.' || t.tgname, pg_get_triggerdef(t.oid) || ';'
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
)
select ord, name, ddl
from items
order by ord, name;
