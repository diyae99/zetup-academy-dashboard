alter table public.quiz_attempts enable row level security;

drop policy if exists "Beneficiaries can read own quiz attempts" on public.quiz_attempts;

create policy "Beneficiaries can read own quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (beneficiary_id = public.current_profile_id());

notify pgrst, 'reload schema';
