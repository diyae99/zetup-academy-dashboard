drop policy if exists "Resource owners can upload files" on storage.objects;
drop policy if exists "Resource owners can update files" on storage.objects;
drop policy if exists "Resource owners can delete files" on storage.objects;
drop policy if exists "Authenticated users can read accessible resource files" on storage.objects;

create policy "Resource owners can upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resources'
  and (storage.foldername(storage.objects.name))[1] = public.current_profile_id()::text
  and exists (
    select 1
    from public.groups g
    where g.id = ((storage.foldername(storage.objects.name))[2])::uuid
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
    or (storage.foldername(storage.objects.name))[1] = public.current_profile_id()::text
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
  and (storage.foldername(storage.objects.name))[1] = public.current_profile_id()::text
)
with check (
  bucket_id = 'resources'
  and (storage.foldername(storage.objects.name))[1] = public.current_profile_id()::text
);

create policy "Resource owners can delete files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resources'
  and (
    public.is_active_admin()
    or (storage.foldername(storage.objects.name))[1] = public.current_profile_id()::text
  )
);

notify pgrst, 'reload schema';
