create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  false,
  26214400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.resources enable row level security;

drop policy if exists "Admins can manage resources" on public.resources;
drop policy if exists "Intervenants can insert assigned resources" on public.resources;
drop policy if exists "Intervenants can manage own resources" on public.resources;
drop policy if exists "Intervenants can delete own resources" on public.resources;
drop policy if exists "Authenticated users can read accessible resources" on public.resources;

create policy "Admins can manage resources"
on public.resources
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "Intervenants can insert assigned resources"
on public.resources
for insert
to authenticated
with check (
  created_by = public.current_profile_id()
  and exists (
    select 1
    from public.groups g
    where g.id = resources.group_id
      and g.intervenant_id = public.current_profile_id()
  )
);

create policy "Intervenants can manage own resources"
on public.resources
for update
to authenticated
using (created_by = public.current_profile_id())
with check (created_by = public.current_profile_id());

create policy "Intervenants can delete own resources"
on public.resources
for delete
to authenticated
using (created_by = public.current_profile_id());

create policy "Authenticated users can read accessible resources"
on public.resources
for select
to authenticated
using (
  public.is_active_admin()
  or created_by = public.current_profile_id()
  or exists (
    select 1
    from public.groups g
    where g.id = resources.group_id
      and g.intervenant_id = public.current_profile_id()
  )
  or exists (
    select 1
    from public.group_members gm
    join public.profiles p on p.id = gm.beneficiary_id
    where gm.group_id = resources.group_id
      and p.auth_user_id = auth.uid()
      and coalesce(gm.status, 'active') = 'active'
  )
);

drop policy if exists "Resource owners can upload files" on storage.objects;
drop policy if exists "Resource owners can read files" on storage.objects;
drop policy if exists "Resource owners can update files" on storage.objects;
drop policy if exists "Resource owners can delete files" on storage.objects;
drop policy if exists "Authenticated users can read accessible resource files" on storage.objects;

create policy "Resource owners can upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = 'resources'
  and (storage.foldername(name))[2] = public.current_profile_id()::text
  and exists (
    select 1
    from public.groups g
    where g.id = ((storage.foldername(name))[3])::uuid
      and g.intervenant_id = public.current_profile_id()
  )
);

create policy "Authenticated users can read accessible resource files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resources'
  and (
    public.is_active_admin()
    or (storage.foldername(name))[2] = public.current_profile_id()::text
    or exists (
      select 1
      from public.resources r
      where r.storage_path = storage.objects.name
        and (
          r.created_by = public.current_profile_id()
          or exists (
            select 1
            from public.groups g
            where g.id = r.group_id
              and g.intervenant_id = public.current_profile_id()
          )
          or exists (
            select 1
            from public.group_members gm
            join public.profiles p on p.id = gm.beneficiary_id
            where gm.group_id = r.group_id
              and p.auth_user_id = auth.uid()
              and coalesce(gm.status, 'active') = 'active'
          )
        )
    )
  )
);

create policy "Resource owners can update files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resources'
  and (storage.foldername(name))[2] = public.current_profile_id()::text
)
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[2] = public.current_profile_id()::text
);

create policy "Resource owners can delete files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resources'
  and (
    public.is_active_admin()
    or (storage.foldername(name))[2] = public.current_profile_id()::text
  )
);

notify pgrst, 'reload schema';
