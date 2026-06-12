import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Role = 'intervenant' | 'beneficiaire';

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeEmail(email: unknown) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRole(role: unknown): Role | null {
  if (role === 'intervenant') return 'intervenant';
  if (role === 'beneficiaire' || role === 'beneficiary') return 'beneficiaire';
  return null;
}

function normalizeAccountStatus(status: unknown) {
  return status === 'suspendu' || status === 'suspended' ? 'suspended' : 'active';
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

async function requireAdmin(req: Request, supabaseUrl: string, anonKey: string, serviceRoleKey: string) {
  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: requesterData, error: requesterError } = await userClient.auth.getUser();
  if (requesterError || !requesterData.user) {
    return { adminClient, error: json({ error: 'Session admin invalide. Veuillez vous reconnecter.' }, 401) };
  }

  const { data: requesterProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('id,role,account_status')
    .eq('auth_user_id', requesterData.user.id)
    .maybeSingle();

  if (profileError) return { adminClient, error: json({ error: profileError.message }, 500) };
  if (!requesterProfile) return { adminClient, error: json({ error: 'Profil administrateur introuvable.' }, 403) };
  if (requesterProfile.role !== 'admin') return { adminClient, error: json({ error: 'Action réservée aux administrateurs.' }, 403) };
  if (requesterProfile.account_status === 'suspended') return { adminClient, error: json({ error: 'Ce compte administrateur est suspendu.' }, 403) };

  return { adminClient, requesterProfile, error: null };
}

async function findProfile(adminClient: ReturnType<typeof createClient>, payload: Record<string, unknown>, role: Role) {
  const profileId = payload.profileId || payload.id;
  const authUserId = payload.authUserId || payload.auth_user_id;
  const email = normalizeEmail(payload.email || payload.loginEmail);

  let query = adminClient
    .from('profiles')
    .select('id,auth_user_id,full_name,email,role,account_status')
    .eq('role', role)
    .limit(1);

  if (isUuid(profileId)) query = query.eq('id', profileId as string);
  else if (isUuid(authUserId)) query = query.eq('auth_user_id', authUserId as string);
  else if (email) query = query.eq('email', email);
  else throw new Error('Profil introuvable: identifiant ou email requis.');

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Profil utilisateur introuvable.');
  if (!data.auth_user_id) throw new Error('Auth user créé mais profil non lié: auth_user_id manquant.');
  return data;
}

async function deleteBeneficiaryData(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const { data: attempts, error: attemptsLoadError } = await adminClient
    .from('quiz_attempts')
    .select('id')
    .eq('beneficiary_id', profileId);
  if (attemptsLoadError) throw new Error(`Lecture résultats: ${attemptsLoadError.message}`);

  const attemptIds = (attempts || []).map((attempt) => attempt.id);
  if (attemptIds.length) {
    const { error } = await adminClient.from('quiz_answers').delete().in('attempt_id', attemptIds);
    if (error) throw new Error(`Suppression réponses quiz: ${error.message}`);
  }

  const deletions = [
    ['quiz_attempts', adminClient.from('quiz_attempts').delete().eq('beneficiary_id', profileId)],
    ['group_members', adminClient.from('group_members').delete().eq('beneficiary_id', profileId)],
  ] as const;

  for (const [label, request] of deletions) {
    const { error } = await request;
    if (error) throw new Error(`Suppression ${label}: ${error.message}`);
  }
}

async function deleteIntervenantData(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const { data: quizzes, error: quizzesLoadError } = await adminClient
    .from('quizzes')
    .select('id')
    .eq('created_by', profileId);
  if (quizzesLoadError) throw new Error(`Lecture quizzes: ${quizzesLoadError.message}`);

  const quizIds = (quizzes || []).map((quiz) => quiz.id);
  if (quizIds.length) {
    const { data: questions, error: questionsLoadError } = await adminClient
      .from('quiz_questions')
      .select('id')
      .in('quiz_id', quizIds);
    if (questionsLoadError) throw new Error(`Lecture questions: ${questionsLoadError.message}`);

    const questionIds = (questions || []).map((question) => question.id);
    const { data: attempts, error: attemptsLoadError } = await adminClient
      .from('quiz_attempts')
      .select('id')
      .in('quiz_id', quizIds);
    if (attemptsLoadError) throw new Error(`Lecture tentatives quiz: ${attemptsLoadError.message}`);

    const attemptIds = (attempts || []).map((attempt) => attempt.id);
    if (attemptIds.length) {
      const { error } = await adminClient.from('quiz_answers').delete().in('attempt_id', attemptIds);
      if (error) throw new Error(`Suppression réponses quiz: ${error.message}`);
    }
    if (questionIds.length) {
      const { error } = await adminClient.from('quiz_options').delete().in('question_id', questionIds);
      if (error) throw new Error(`Suppression options quiz: ${error.message}`);
    }

    for (const [label, request] of [
      ['quiz_attempts', adminClient.from('quiz_attempts').delete().in('quiz_id', quizIds)],
      ['quiz_questions', adminClient.from('quiz_questions').delete().in('quiz_id', quizIds)],
      ['quizzes', adminClient.from('quizzes').delete().in('id', quizIds)],
    ] as const) {
      const { error } = await request;
      if (error) throw new Error(`Suppression ${label}: ${error.message}`);
    }
  }

  const { error: resourcesError } = await adminClient.from('resources').delete().eq('created_by', profileId);
  if (resourcesError) throw new Error(`Suppression ressources: ${resourcesError.message}`);

  const { error: groupsError } = await adminClient
    .from('groups')
    .update({ intervenant_id: null })
    .eq('intervenant_id', profileId);
  if (groupsError) throw new Error(`Désassignation groupes: ${groupsError.message}`);

  await adminClient.from('intervenants').delete().eq('auth_user_id', profileId);
}

async function deleteProfileAndAuth(adminClient: ReturnType<typeof createClient>, profile: { id: string; auth_user_id: string; role: string }) {
  if (profile.role === 'beneficiaire') await deleteBeneficiaryData(adminClient, profile.id);
  if (profile.role === 'intervenant') await deleteIntervenantData(adminClient, profile.id);

  await adminClient.from('intervenants').delete().eq('auth_user_id', profile.auth_user_id);

  const { error: profileError } = await adminClient.from('profiles').delete().eq('id', profile.id);
  if (profileError) throw new Error(`Suppression profil: ${profileError.message}`);

  const { error: authError } = await adminClient.auth.admin.deleteUser(profile.auth_user_id);
  if (authError) throw new Error(`Suppression compte Auth: ${authError.message}`);
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

  const { adminClient, error: adminError } = await requireAdmin(req, supabaseUrl, anonKey, serviceRoleKey);
  if (adminError) return adminError;

  const payload = await req.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(payload?.action || '');
  const role = normalizeRole(payload?.role);

  try {
    if (action === 'reset-password') {
      if (!role) return json({ error: 'Rôle utilisateur invalide.' }, 400);
      const password = String(payload?.password || '');
      if (!password || password.length < 6) return json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, 400);

      const profile = await findProfile(adminClient, payload || {}, role);
      const { error } = await adminClient.auth.admin.updateUserById(profile.auth_user_id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: profile.full_name, role },
      });
      if (error) return json({ error: error.message }, error.status || 400);
      return json({ message: 'Mot de passe réinitialisé avec succès', email: profile.email });
    }

    if (action === 'set-status') {
      if (!role) return json({ error: 'Rôle utilisateur invalide.' }, 400);
      const accountStatus = normalizeAccountStatus(payload?.accountStatus);
      const profile = await findProfile(adminClient, payload || {}, role);
      const { error } = await adminClient
        .from('profiles')
        .update({ account_status: accountStatus })
        .eq('id', profile.id);
      if (error) throw new Error(error.message);
      return json({ message: accountStatus === 'suspended' ? 'Compte suspendu avec succès' : 'Compte activé avec succès', accountStatus });
    }

    if (action === 'delete-user') {
      if (!role) return json({ error: 'Rôle utilisateur invalide.' }, 400);
      const profile = await findProfile(adminClient, payload || {}, role);
      await deleteProfileAndAuth(adminClient, profile);
      return json({ message: role === 'beneficiaire' ? 'Bénéficiaire supprimé avec succès' : 'Intervenant supprimé avec succès' });
    }

    if (action === 'delete-all') {
      if (!role) return json({ error: 'Rôle utilisateur invalide.' }, 400);
      if (payload?.confirmation !== 'DELETE') return json({ error: 'Confirmation DELETE requise.' }, 400);
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('id,auth_user_id,full_name,email,role,account_status')
        .eq('role', role);
      if (error) throw new Error(error.message);

      let deleted = 0;
      const failures: string[] = [];
      for (const profile of profiles || []) {
        try {
          await deleteProfileAndAuth(adminClient, profile);
          deleted += 1;
        } catch (deleteError) {
          failures.push(`${profile.email}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
        }
      }

      if (failures.length) return json({ error: 'Certains comptes n’ont pas pu être supprimés.', deleted, failures }, 500);
      return json({ message: 'Suppression terminée avec succès', deleted });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Action impossible.' }, 500);
  }
});
