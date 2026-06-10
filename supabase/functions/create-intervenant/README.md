# create-intervenant

Secure Supabase Edge Function used by the admin panel to create an intervenant account.

Required Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` must be configured only as an Edge Function secret. It must never be added to `.env.local` or frontend code.

The function:

1. Verifies the caller session.
2. Verifies the caller profile has role `admin`.
3. Creates a Supabase Auth user.
4. Inserts `public.profiles` with `auth_user_id` equal to the created Auth user id and role `intervenant`.
5. Attempts to insert/link an `intervenants` row with the same `auth_user_id`.
