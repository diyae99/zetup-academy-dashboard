import { supabase } from '../lib/supabaseClient';

const missingProfileMessage = 'Profil utilisateur introuvable. Veuillez contacter l’administration.';
const suspendedMessage = 'Ce compte est suspendu. Veuillez contacter l’administration.';
const invalidRoleMessage = 'Profil utilisateur trouvé mais rôle manquant ou invalide. Veuillez contacter l’administration.';
const allowedRoles = new Set(['admin', 'intervenant', 'beneficiaire']);

export function roleHome(role) {
  return {
    admin: '/admin/dashboard',
    intervenant: '/intervenant/dashboard',
    beneficiaire: '/beneficiaire/dashboard',
  }[role] || '/login';
}

function normalizeProfile(profile, authUser) {
  return {
    id: authUser.id,
    profileId: profile.id,
    authUserId: authUser.id,
    name: profile.full_name,
    fullName: profile.full_name,
    email: profile.email || authUser.email,
    role: profile.role,
    accountStatus: profile.account_status,
  };
}

export async function fetchProfile(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,account_status,auth_user_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(missingProfileMessage);
  if (!allowedRoles.has(data.role)) throw new Error(invalidRoleMessage);
  if (data.account_status === 'suspended') {
    await supabase.auth.signOut();
    throw new Error(suspendedMessage);
  }
  return normalizeProfile(data, authUser);
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  try {
    const user = await fetchProfile(data.user);
    return { user };
  } catch (profileError) {
    return { error: profileError.message };
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return { user: null, error: error?.message || null };

  try {
    const user = await fetchProfile(data.session.user);
    return { user, error: null };
  } catch (profileError) {
    return { user: null, error: profileError.message };
  }
}

export async function logout() {
  await supabase.auth.signOut();
}

export { invalidRoleMessage, missingProfileMessage, suspendedMessage };
