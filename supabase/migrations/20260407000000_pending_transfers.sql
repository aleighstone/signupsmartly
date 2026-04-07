create table if not exists pending_transfers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  source_event_id uuid references events(id) on delete set null,
  sender_id uuid not null references auth.users(id),
  recipient_email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  claimed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists pending_transfers_token_idx on pending_transfers(token);
create index if not exists pending_transfers_recipient_email_idx on pending_transfers(recipient_email);
create index if not exists pending_transfers_sender_id_idx on pending_transfers(sender_id);
create index if not exists pending_transfers_event_id_idx on pending_transfers(event_id);

alter table pending_transfers enable row level security;

drop policy if exists "pending_transfers_select_own_sender" on pending_transfers;
create policy "pending_transfers_select_own_sender"
  on pending_transfers
  for select
  to authenticated
  using (auth.uid() = sender_id);

drop policy if exists "pending_transfers_delete_own_sender" on pending_transfers;
create policy "pending_transfers_delete_own_sender"
  on pending_transfers
  for delete
  to authenticated
  using (auth.uid() = sender_id);
