drop policy if exists "Admins can read profiles" on public.profiles;

create policy "Admins can read profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.auth_user_id = auth.uid()
      and admin_profile.role = 'admin'
      and admin_profile.account_status = 'active'
  )
);

notify pgrst, 'reload schema';
