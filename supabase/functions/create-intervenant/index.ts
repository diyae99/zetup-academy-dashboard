import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const validStatuses = new Set(['active', 'suspended']);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeStatus(status: string | undefined) {
  if (status === 'suspendu' || status === 'suspended') return 'suspended';
  return 'active';
}

function isExistingEmailError(message = '') {
  const normalized = message.toLowerCase();
  return normalized.includes('already') || normalized.includes('registered') || normalized.includes('duplicate') || normalized.includes('exists');
}

async function insertIntervenant(adminClient: ReturnType<typeof createClient>, input: {
  authUserId: string;
  fullName: string;
  email: string;
  phone: string;
  languages: unknown[];
  levels: unknown[];
}) {
  const attempts = [
    {
      auth_user_id: input.authUserId,
      name: input.fullName,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      languages: input.languages,
      levels: input.levels,
      status: 'actif',
      account_status: 'active',
      role: 'intervenant',
    },
    {
      auth_user_id: input.authUserId,
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      languages: input.languages,
      levels: input.levels,
      status: 'actif',
    },
    {
      auth_user_id: input.authUserId,
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      status: 'actif',
    },
  ];

  const errors: string[] = [];
  for (const payload of attempts) {
    const { data, error } = await adminClient
      .from('intervenants')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (!error) return { data, error: null, errors };
    errors.push(error.message);
  }

  return { data: null, error: errors.at(-1) || 'Insertion intervenant impossible.', errors };
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
  const languages = Array.isArray(payload?.languages) ? payload.languages : [];
  const levels = Array.isArray(payload?.levels) ? payload.levels : [];
  const accountStatus = normalizeStatus(payload?.accountStatus);

  if (!email || !password || !fullName) {
    return json({ error: 'Nom complet, email de connexion et mot de passe temporaire sont obligatoires.' }, 400);
  }
  if (!validStatuses.has(accountStatus)) {
    return json({ error: 'Statut de compte invalide.' }, 400);
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('profiles')
    .select('auth_user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfileError) return json({ error: existingProfileError.message }, 500);
  if (existingProfile) return json({ error: 'Email déjà utilisé.' }, 409);

  const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'intervenant' },
  });

  if (createAuthError) {
    const message = isExistingEmailError(createAuthError.message)
      ? 'Email déjà utilisé.'
      : createAuthError.message;
    return json({ error: message }, createAuthError.status || 400);
  }

  const authUser = authData.user;
  if (!authUser?.id) {
    return json({ error: 'Utilisateur Auth créé sans identifiant. Veuillez contacter l’administration.' }, 500);
  }

  const profilePayload = {
    auth_user_id: authUser.id,
    full_name: fullName,
    email,
    role: 'intervenant',
    account_status: accountStatus,
  };

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'auth_user_id' })
    .select('auth_user_id,full_name,email,role,account_status')
    .single();

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authUser.id);
    return json({
      error: 'Utilisateur Auth créé mais profil manquant. Création annulée : impossible de créer le profil intervenant.',
      details: profileError.message,
    }, 500);
  }

  const { data: verifiedProfile } = await adminClient
    .from('profiles')
    .select('auth_user_id,role')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (!verifiedProfile) {
    await adminClient.auth.admin.deleteUser(authUser.id);
    return json({ error: 'Utilisateur Auth créé mais profil manquant. Création annulée.' }, 500);
  }
  if (verifiedProfile.role !== 'intervenant') {
    await adminClient.auth.admin.deleteUser(authUser.id);
    return json({ error: 'Profil créé mais rôle manquant ou invalide. Création annulée.' }, 500);
  }

  const { data: intervenant, error: intervenantError, errors: intervenantErrors } = await insertIntervenant(adminClient, {
    authUserId: authUser.id,
    fullName,
    email,
    phone,
    languages,
    levels,
  });

  return json({
    message: 'Compte intervenant créé avec succès',
    authUserId: authUser.id,
    profile,
    intervenant,
    warning: intervenantError
      ? `Compte Auth et profil créés. Ligne intervenant non créée : ${intervenantError}. Détails: ${intervenantErrors.join(' | ')}`
      : null,
  });
});
