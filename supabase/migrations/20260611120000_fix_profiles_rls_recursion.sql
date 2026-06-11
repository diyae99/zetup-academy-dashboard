drop policy if exists "Admins can read profiles" on public.profiles;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Authenticated users can read own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "Admins can read profiles"
on public.profiles
for select
to authenticated
using (public.is_active_admin());

notify pgrst, 'reload schema';
