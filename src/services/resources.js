import { supabase } from '../lib/supabaseClient';
import { fetchAssignedGroupsForIntervenant } from './groupAssignments';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const RESOURCE_TYPES = ['PDF', 'PPTX', 'Word', 'Video link', 'Audio'];

const typeToDb = {
  PDF: 'pdf',
  PPTX: 'pptx',
  Word: 'word',
  'Video link': 'video_link',
  Audio: 'audio',
};

const dbToType = {
  pdf: 'PDF',
  pptx: 'PPTX',
  word: 'Word',
  video_link: 'Video link',
  audio: 'Audio',
};

const allowedMimeTypes = {
  PDF: ['application/pdf'],
  PPTX: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  Word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  Audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4'],
};

function safeFilename(name) {
  const fallback = 'ressource';
  return (name || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || fallback;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function currentProfileId(user) {
  return user?.profileId || null;
}

export function validateResourceForm({ title, groupId, type, file, url }) {
  if (!title?.trim()) return 'Le titre est obligatoire.';
  if (!groupId) return 'Sélectionnez un groupe.';
  if (!typeToDb[type]) return 'Sélectionnez un type de ressource valide.';

  if (type === 'Video link') {
    if (!url?.trim()) return 'Le lien vidéo est obligatoire.';
    if (!isValidUrl(url.trim())) return 'Le lien vidéo doit être une URL valide.';
    return '';
  }

  if (!file) return 'Choisissez un fichier à téléverser.';
  if (file.size > MAX_FILE_SIZE) return 'Le fichier dépasse la limite de 25 Mo.';
  if (!allowedMimeTypes[type]?.includes(file.type)) {
    return `Type de fichier invalide pour ${type}.`;
  }

  return '';
}

export async function loadIntervenantResourceWorkspace(user) {
  const { intervenant, groups } = await fetchAssignedGroupsForIntervenant(user);

  const { data, error } = await supabase
    .from('resources')
    .select('id,title,description,resource_type,resource_url,storage_path,language_id,level_id,group_id,created_by,status,created_at')
    .eq('created_by', intervenant.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Impossible de charger les ressources: ${error.message}`);

  return {
    intervenant,
    groups,
    resources: (data || []).map((resource) => normalizeResource(resource, groups)),
  };
}

export async function loadAdminResourcesWorkspace() {
  const [resourcesResult, groupsResult, profilesResult, languagesResult, levelsResult] = await Promise.all([
    supabase
      .from('resources')
      .select('id,title,description,resource_type,resource_url,storage_path,language_id,level_id,group_id,created_by,status,created_at')
      .order('created_at', { ascending: false }),
    supabase.from('groups').select('id,name,language_id,level_id,intervenant_id'),
    supabase.from('profiles').select('id,full_name,email,role').eq('role', 'intervenant'),
    supabase.from('languages').select('id,name'),
    supabase.from('levels').select('id,name'),
  ]);

  if (resourcesResult.error) throw new Error(`Impossible de charger les ressources: ${resourcesResult.error.message}`);
  if (groupsResult.error) throw new Error(`Impossible de charger les groupes: ${groupsResult.error.message}`);
  if (profilesResult.error) throw new Error(`Impossible de charger les intervenants: ${profilesResult.error.message}`);
  if (languagesResult.error) throw new Error(`Impossible de charger les langues: ${languagesResult.error.message}`);
  if (levelsResult.error) throw new Error(`Impossible de charger les niveaux: ${levelsResult.error.message}`);

  const languageMap = new Map((languagesResult.data || []).map((item) => [item.id, item.name]));
  const levelMap = new Map((levelsResult.data || []).map((item) => [item.id, item.name]));
  const groups = (groupsResult.data || []).map((group) => ({
    id: group.id,
    name: group.name,
    languageId: group.language_id,
    levelId: group.level_id,
    language: languageMap.get(group.language_id) || '',
    level: levelMap.get(group.level_id) || '',
    intervenantId: group.intervenant_id,
  }));
  const intervenants = (profilesResult.data || []).map((profile) => ({
    id: profile.id,
    name: profile.full_name || profile.email,
    email: profile.email,
  }));

  return {
    groups,
    intervenants,
    resources: (resourcesResult.data || []).map((resource) => {
      const normalized = normalizeResource(resource, groups);
      const intervenant = intervenants.find((item) => item.id === normalized.intervenantId);
      return {
        ...normalized,
        intervenantName: intervenant?.name || 'Intervenant non défini',
      };
    }),
  };
}

export async function createResource({ user, groups, values }) {
  const profileId = currentProfileId(user);
  if (!profileId) throw new Error('Profil utilisateur introuvable. Veuillez vous reconnecter.');

  const selectedGroup = groups.find((group) => group.id === values.groupId);
  if (!selectedGroup) throw new Error('Groupe sélectionné introuvable.');

  const validationError = validateResourceForm(values);
  if (validationError) throw new Error(validationError);

  let storagePath = null;
  let resourceUrl = values.url?.trim() || null;

  if (values.type !== 'Video link') {
    const filename = safeFilename(values.file.name);
    storagePath = `${profileId}/${selectedGroup.id}/${Date.now()}-${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(storagePath, values.file, {
        cacheControl: '3600',
        contentType: values.file.type,
        upsert: false,
      });

    if (uploadError) {
      const authorizationMessage = uploadError.message?.toLowerCase().includes('row-level security')
        ? 'Vous n’avez pas l’autorisation d’ajouter une ressource à ce groupe.'
        : 'Erreur de téléversement Supabase Storage.';
      throw new Error(`${authorizationMessage} ${uploadError.message}`);
    }
    resourceUrl = null;
  }

  const payload = {
    title: values.title.trim(),
    description: values.description?.trim() || null,
    resource_type: typeToDb[values.type],
    resource_url: resourceUrl,
    storage_path: storagePath,
    language_id: selectedGroup.languageId || null,
    level_id: selectedGroup.levelId || null,
    group_id: selectedGroup.id,
    created_by: profileId,
    status: 'published',
  };

  const { data, error } = await supabase
    .from('resources')
    .insert(payload)
    .select('id,title,description,resource_type,resource_url,storage_path,language_id,level_id,group_id,created_by,status,created_at')
    .single();

  if (error) {
    if (storagePath) await supabase.storage.from('resources').remove([storagePath]);
    const authorizationMessage = error.message?.toLowerCase().includes('row-level security')
      ? 'Vous n’avez pas l’autorisation d’ajouter une ressource à ce groupe.'
      : 'Ressource téléversée mais non enregistrée.';
    throw new Error(`${authorizationMessage} ${error.message}`);
  }

  return normalizeResource(data, groups);
}

export async function openResource(resource) {
  if (resource.type === 'Video link') {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!resource.storagePath) throw new Error('Fichier introuvable pour cette ressource.');
  const { data, error } = await supabase.storage.from('resources').createSignedUrl(resource.storagePath, 60 * 10);
  if (error) throw new Error(`Impossible d’ouvrir le fichier: ${error.message}`);
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function deleteResource(resource) {
  const { error } = await supabase.from('resources').delete().eq('id', resource.id);
  if (error) throw new Error(`Impossible de supprimer la ressource: ${error.message}`);
  if (resource.storagePath) await supabase.storage.from('resources').remove([resource.storagePath]);
}

export function normalizeResource(resource, groups = []) {
  const group = groups.find((item) => item.id === resource.group_id);
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description || '',
    type: dbToType[resource.resource_type] || resource.resource_type,
    url: resource.resource_url,
    storagePath: resource.storage_path,
    groupId: resource.group_id,
    groupName: group?.name || 'Groupe non défini',
    language: group?.language || '',
    level: group?.level || '',
    languageId: resource.language_id,
    levelId: resource.level_id,
    intervenantId: resource.created_by,
    createdAt: resource.created_at,
    status: resource.status,
  };
}
