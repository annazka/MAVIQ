begin;

create table if not exists public.maviq_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  ledger jsonb not null check (jsonb_typeof(ledger) = 'object')
);

alter table public.maviq_workspaces enable row level security;
revoke all on public.maviq_workspaces from anon, authenticated;
grant select on public.maviq_workspaces to authenticated;
grant all on public.maviq_workspaces to service_role;
drop policy if exists "Owner reads workspace" on public.maviq_workspaces;
create policy "Owner reads workspace" on public.maviq_workspaces
  for select to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maviq-private-receipts', 'maviq-private-receipts', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "MAVIQ owner uploads receipts" on storage.objects;
create policy "MAVIQ owner uploads receipts" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'maviq-private-receipts' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "MAVIQ owner reads receipts" on storage.objects;
create policy "MAVIQ owner reads receipts" on storage.objects
  for select to authenticated using (
    bucket_id = 'maviq-private-receipts' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "MAVIQ owner removes receipt drafts" on storage.objects;
create policy "MAVIQ owner removes receipt drafts" on storage.objects
  for delete to authenticated using (
    bucket_id = 'maviq-private-receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and not exists (
      select 1 from public.maviq_workspaces
      cross join lateral jsonb_array_elements(ledger -> 'entries') as entry(row)
      where owner_id = (select auth.uid()) and entry.row ->> 'receiptPath' = storage.objects.name
    )
  );

commit;
