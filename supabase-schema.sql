create table if not exists public.app_state (
    id text primary key,
    data jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_public_read" on public.app_state;
drop policy if exists "app_state_public_insert_plantas" on public.app_state;
drop policy if exists "app_state_public_update_plantas" on public.app_state;

create policy "app_state_public_read"
on public.app_state
for select
to anon
using (id = 'plantas');

create policy "app_state_public_insert_plantas"
on public.app_state
for insert
to anon
with check (id = 'plantas');

create policy "app_state_public_update_plantas"
on public.app_state
for update
to anon
using (id = 'plantas')
with check (id = 'plantas');
