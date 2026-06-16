import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeStatus(status: string | undefined) {
  return status === 'suspendu' || status === 'suspended' ? 'suspended' : 'active';
}

function isExistingEmailError(message = '') {
  const normalized = message.toLowerCase();
  return normalized.includes('already') || normalized.includes('registered') || normalized.includes('duplicate') || normalized.includes('exists');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found || data.users.length < 1000) return found || null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Configuration Supabase Edge Function incomplète.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: requesterData, error: requesterError } = await userClient.auth.getUser();
  if (requesterError || !requesterData.user) {
    return json({ error: 'Session admin invalide. Veuillez vous reconnecter.' }, 401);
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminClient
    .from('profiles')
    .select('role,account_status')
    .eq('auth_user_id', requesterData.user.id)
    .maybeSingle();

  if (requesterProfileError) return json({ error: requesterProfileError.message }, 500);
  if (!requesterProfile) return json({ error: 'Profil administrateur introuvable. Veuillez contacter l’administration.' }, 403);
  if (requesterProfile.role !== 'admin') return json({ error: 'Action réservée aux administrateurs.' }, 403);
  if (requesterProfile.account_status === 'suspended') return json({ error: 'Ce compte est suspendu. Veuillez contacter l’administration.' }, 403);

  const payload = await req.json().catch(() => null);
  const email = String(payload?.email || payload?.loginEmail || '').trim().toLowerCase();
  const password = String(payload?.password || '');
  const fullName = String(payload?.fullName || payload?.name || '').trim();
  const phone = String(payload?.phone || '').trim();
  const groupIds = Array.isArray(payload?.groupIds) ? payload.groupIds.map(String).filter(isUuid) : [];
  const accountStatus = normalizeStatus(payload?.accountStatus);

  if (!email || !password || !fullName) {
    return json({ error: 'Nom complet, email de connexion et mot de passe temporaire sont obligatoires.' }, 400);
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('profiles')
    .select('id,auth_user_id,role')
    .eq('email', email)
    .maybeSingle();

  if (existingProfileError) return json({ error: existingProfileError.message }, 500);
  if (existingProfile?.auth_user_id && existingProfile.role === 'beneficiaire') {
    return json({ error: 'Ce compte existe déjà.' }, 409);
  }
  if (existingProfile?.role && existingProfile.role !== 'beneficiaire') {
    return json({ error: 'Ce compte existe déjà.' }, 409);
  }

  let authUser = await findAuthUserByEmail(adminClient, email);
  if (authUser) {
    const { data, error } = await adminClient.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'beneficiaire' },
    });
    if (error) return json({ error: error.message }, error.status || 400);
    authUser = data.user;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'beneficiaire' },
    });
    if (error) {
      const message = isExistingEmailError(error.message) ? 'Ce compte existe déjà.' : error.message;
      return json({ error: message }, error.status || 400);
    }
    authUser = data.user;
  }

  if (!authUser?.id) return json({ error: 'Utilisateur Auth créé sans identifiant.' }, 500);

  const profilePayload = {
    auth_user_id: authUser.id,
    full_name: fullName,
    email,
    phone,
    role: 'beneficiaire',
    account_status: accountStatus,
  };
  const profileUpsertPayload = existingProfile?.id ? { id: existingProfile.id, ...profilePayload } : profilePayload;

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert(profileUpsertPayload, { onConflict: existingProfile?.id ? 'id' : 'auth_user_id' })
    .select('id,auth_user_id,full_name,email,role,account_status')
    .single();

  if (profileError) return json({ error: `Compte Auth créé mais profil bénéficiaire non créé : ${profileError.message}` }, 500);
  if (profile.role !== 'beneficiaire') return json({ error: 'Profil créé mais rôle manquant ou invalide.' }, 500);

  if (groupIds.length) {
    const memberships = groupIds.map((groupId) => ({
      group_id: groupId,
      beneficiary_id: profile.id,
      status: 'active',
    }));
    const { error: membershipError } = await adminClient
      .from('group_members')
      .upsert(memberships, { onConflict: 'group_id,beneficiary_id' });
    if (membershipError) {
      return json({
        error: "Compte créé, mais l'affectation au groupe a échoué.",
        details: membershipError.message,
      }, 500);
    }
  }

  return json({
    message: 'Compte bénéficiaire créé avec succès',
    authUserId: authUser.id,
    profile,
  });
});
