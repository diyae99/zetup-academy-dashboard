import { supabase } from '../lib/supabaseClient';

function mapAccountStatus(status) {
  return status === 'suspended' || status === 'suspendu' ? 'suspended' : 'active';
}

export function toGroupDbStatus(status) {
  return status === 'archived' || status === 'archivé' ? 'archived' : 'active';
}

export function toGroupDisplayStatus(status) {
  return status === 'archived' || status === 'archivé' ? 'archivé' : 'actif';
}

async function resolveIntervenantProfile(user) {
  const authUserId = user?.authUserId || user?.id;
  if (!authUserId && !user?.email) throw new Error('Session intervenant introuvable.');

  let query = supabase
    .from('profiles')
    .select('id,auth_user_id,full_name,email,account_status,role')
    .eq('role', 'intervenant')
    .limit(1);

  if (authUserId) {
    query = query.eq('auth_user_id', authUserId);
  } else {
    query = query.ilike('email', user.email);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Impossible de charger le profil intervenant: ${error.message}`);
  if (data) return data;

  if (user?.email && authUserId) {
    const fallback = await supabase
      .from('profiles')
      .select('id,auth_user_id,full_name,email,account_status,role')
      .eq('role', 'intervenant')
      .ilike('email', user.email)
      .maybeSingle();
    if (fallback.error) throw new Error(`Impossible de charger le profil intervenant: ${fallback.error.message}`);
    if (fallback.data) return fallback.data;
  }

  throw new Error('Aucun profil intervenant lié à ce compte. Contactez l’administrateur.');
}

async function loadLookup(table, ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase.from(table).select('id,name').in('id', uniqueIds);
  if (error) throw new Error(`Impossible de charger les ${table}: ${error.message}`);
  return new Map((data || []).map((item) => [item.id, item.name]));
}

export async function fetchAssignedGroupsForIntervenant(user) {
  const intervenant = await resolveIntervenantProfile(user);

  const { data, error } = await supabase
    .from('groups')
    .select('id,name,language_id,level_id,intervenant_id,status,description,created_at')
    .eq('intervenant_id', intervenant.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Impossible de charger vos groupes assignés: ${error.message}`);

  const groups = data || [];
  const [languageNames, levelNames] = await Promise.all([
    loadLookup('languages', groups.map((group) => group.language_id)),
    loadLookup('levels', groups.map((group) => group.level_id)),
  ]);

  return {
    intervenant,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      languageId: group.language_id,
      levelId: group.level_id,
      language: languageNames.get(group.language_id) || 'Langue non définie',
      level: levelNames.get(group.level_id) || 'Niveau non défini',
      intervenantId: group.intervenant_id,
      beneficiaryIds: [],
      averageScore: 0,
      status: toGroupDisplayStatus(group.status),
      description: group.description || '',
      createdAt: group.created_at,
    })),
  };
}

export async function fetchAdminGroupFormData() {
  const [intervenantsResult, languagesResult, levelsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,auth_user_id,full_name,email,account_status,role')
      .eq('role', 'intervenant')
      .order('created_at', { ascending: false }),
    supabase.from('languages').select('id,name').order('name'),
    supabase.from('levels').select('id,name,sort_order').order('sort_order'),
  ]);

  if (intervenantsResult.error) throw new Error(`Impossible de charger les intervenants: ${intervenantsResult.error.message}`);
  if (languagesResult.error) throw new Error(`Impossible de charger les langues: ${languagesResult.error.message}`);
  if (levelsResult.error) throw new Error(`Impossible de charger les niveaux: ${levelsResult.error.message}`);

  return {
    intervenants: (intervenantsResult.data || []).map((item) => ({
      id: item.id,
      authUserId: item.auth_user_id,
      name: item.full_name || item.email,
      email: item.email,
      accountStatus: item.account_status,
      status: item.account_status === 'suspended' ? 'suspendu' : 'actif',
    })),
    languages: languagesResult.data || [],
    levels: levelsResult.data || [],
  };
}

export async function createAssignedGroup({ name, languageId, levelId, intervenantId, status = 'active' }) {
  if (!name?.trim()) throw new Error('Le nom du groupe est obligatoire.');
  if (!languageId) throw new Error('La langue du groupe est obligatoire.');
  if (!levelId) throw new Error('Le niveau du groupe est obligatoire.');
  if (!intervenantId) throw new Error('Un intervenant doit être assigné au groupe.');

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      language_id: languageId,
      level_id: levelId,
      intervenant_id: intervenantId,
      status: toGroupDbStatus(status),
    })
    .select('id,name,language_id,level_id,intervenant_id,status,created_at')
    .single();

  if (error?.message?.includes('groups_status_check')) {
    throw new Error('Impossible de créer le groupe: le statut doit être actif ou archivé.');
  }
  if (error) throw new Error(`Impossible de créer le groupe: ${error.message}`);
  return data;
}

export { mapAccountStatus };
