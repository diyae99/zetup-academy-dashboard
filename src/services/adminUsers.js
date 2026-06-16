import { supabase } from '../lib/supabaseClient';

function normalizeAccountStatus(status) {
  return status === 'suspended' || status === 'suspendu' ? 'suspendu' : 'actif';
}

function normalizeRole(role) {
  return role === 'beneficiary' ? 'beneficiaire' : role;
}

async function readFunctionError(error) {
  if (!error?.context) return null;
  try {
    return await error.context.json();
  } catch {
    try {
      return { error: await error.context.text() };
    } catch {
      return null;
    }
  }
}

export async function loadAdminAccounts(role) {
  const normalizedRole = normalizeRole(role);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id,auth_user_id,full_name,email,phone,role,account_status,created_at')
    .eq('role', normalizedRole)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Impossible de charger les comptes: ${error.message}`);

  if (normalizedRole === 'beneficiaire') {
    const profileIds = (profiles || []).map((profile) => profile.id);
    const membershipsResult = profileIds.length
      ? await supabase.from('group_members').select('group_id,beneficiary_id,status,groups(id,name)').in('beneficiary_id', profileIds)
      : { data: [], error: null };
    if (membershipsResult.error) throw new Error(`Impossible de charger les groupes bénéficiaires: ${membershipsResult.error.message}`);

    return (profiles || []).map((profile) => ({
      id: profile.id,
      profileId: profile.id,
      authUserId: profile.auth_user_id,
      name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role,
      groupIds: (membershipsResult.data || []).filter((item) => item.beneficiary_id === profile.id && item.status !== 'removed').map((item) => item.group_id),
      groupNames: (membershipsResult.data || []).filter((item) => item.beneficiary_id === profile.id && item.status !== 'removed').map((item) => item.groups?.name).filter(Boolean),
      status: profile.account_status === 'suspended' ? 'suspendu' : 'actif',
      accountStatus: normalizeAccountStatus(profile.account_status),
      lastLogin: 'Valeur Supabase',
    }));
  }

  return (profiles || []).map((profile) => ({
    id: profile.id,
    profileId: profile.id,
    authUserId: profile.auth_user_id,
    name: profile.full_name || profile.email,
    email: profile.email,
    phone: profile.phone || '',
    role: profile.role,
    languages: [],
    levels: [],
    status: profile.account_status === 'suspended' ? 'suspendu' : 'actif',
    accountStatus: normalizeAccountStatus(profile.account_status),
    lastLogin: 'Valeur Supabase',
  }));
}

export async function loadAdminGroupsForSelection() {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,status')
    .order('name');

  if (error) throw new Error(`Impossible de charger les groupes: ${error.message}`);
  return (data || []).map((group) => ({
    id: group.id,
    name: group.name,
    status: group.status,
  }));
}

export async function manageAccount(payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  const { data, error } = await supabase.functions.invoke('manage-account', {
    body: payload,
  });

  if (error) {
    const details = await readFunctionError(error);
    throw new Error(details?.error || error.message || 'Action compte impossible.');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function resetAccountPassword({ role, row, password }) {
  return manageAccount({
    action: 'reset-password',
    role,
    id: row.profileId || row.id,
    authUserId: row.authUserId,
    email: row.email,
    password,
  });
}

export async function setAccountStatus({ role, row, accountStatus }) {
  return manageAccount({
    action: 'set-status',
    role,
    id: row.profileId || row.id,
    authUserId: row.authUserId,
    email: row.email,
    accountStatus,
  });
}

export async function deleteAccount({ role, row }) {
  return manageAccount({
    action: 'delete-user',
    role,
    id: row.profileId || row.id,
    authUserId: row.authUserId,
    email: row.email,
  });
}

export async function deleteAllAccounts({ role, confirmation }) {
  return manageAccount({
    action: 'delete-all',
    role,
    confirmation,
  });
}

export async function createIntervenantAccount(payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  if (!import.meta.env.VITE_SUPABASE_URL || !(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('Configuration Supabase frontend incomplète. Vérifiez VITE_SUPABASE_URL et la clé publique.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-intervenant', {
      body: payload,
    });

    if (error) {
      const details = await readFunctionError(error);

      console.error('create-intervenant returned an error', {
        functionName: 'create-intervenant',
        payload: { ...payload, password: payload.password ? '[masqué]' : '' },
        error,
        details,
      });

      throw new Error(details?.error || error.message || 'Impossible de créer le compte intervenant.');
    }

    console.info('create-intervenant succeeded', {
      functionName: 'create-intervenant',
      authUserId: data?.authUserId,
      warning: data?.warning,
    });

    return data;
  } catch (error) {
    if (error.message?.startsWith('Impossible de créer') || error.message?.includes('déployée')) {
      throw error;
    }
    console.error('create-intervenant request failed', {
      functionName: 'create-intervenant',
      payload: { ...payload, password: payload.password ? '[masqué]' : '' },
      error,
    });
    throw new Error(`Impossible de joindre la fonction create-intervenant. Vérifiez que l’Edge Function est déployée et que CORS est configuré. Détail: ${error.message}`);
  }
}

export async function createBeneficiaireAccount(payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-beneficiaire', {
      body: payload,
    });

    if (error) {
      const details = await readFunctionError(error);
      if (import.meta.env.DEV) console.error('create-beneficiaire returned an error', { details, error });
      throw new Error(details?.error || error.message || 'Impossible de créer le compte bénéficiaire.');
    }

    return data;
  } catch (error) {
    if (error.message?.startsWith('Impossible de créer') || error.message === 'Ce compte existe déjà.') {
      throw error;
    }
    throw new Error(`Impossible de joindre la fonction create-beneficiaire. Vérifiez que l’Edge Function est déployée. Détail: ${error.message}`);
  }
}
