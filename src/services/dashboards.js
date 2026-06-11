import { supabase } from '../lib/supabaseClient';

function byId(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function nameOf(profile) {
  return profile?.full_name || profile?.email || 'Utilisateur';
}

function percentAverage(items) {
  const values = (items || []).map((item) => Number(item.score_percent)).filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function localQuizOwnerId(quiz) {
  return quiz.createdBy || quiz.created_by || quiz.intervenantId || quiz.intervenant_id || null;
}

function mergeQuizzes(remoteQuizzes, localQuizzes = []) {
  const normalizedLocal = localQuizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    group_id: quiz.groupId || quiz.group_id,
    created_by: localQuizOwnerId(quiz),
    status: quiz.status,
    created_at: quiz.createdAt || quiz.created_at || null,
    source: 'local',
  }));
  const byQuizId = new Map();
  [...remoteQuizzes, ...normalizedLocal].forEach((quiz) => {
    if (quiz?.id && !byQuizId.has(quiz.id)) byQuizId.set(quiz.id, quiz);
  });
  return [...byQuizId.values()];
}

export async function fetchIntervenantDashboard(user, localData = {}) {
  const profileId = user?.profileId;
  if (!profileId) throw new Error('Profil utilisateur introuvable. Veuillez vous reconnecter.');

  const [groupsResult, resourcesResult, quizzesResult, attemptsResult, languagesResult, levelsResult] = await Promise.all([
    supabase.from('groups').select('id,name,language_id,level_id,status,created_at').eq('intervenant_id', profileId).order('created_at', { ascending: false }),
    supabase.from('resources').select('id,title,group_id,created_by,created_at').eq('created_by', profileId).order('created_at', { ascending: false }),
    supabase.from('quizzes').select('id,title,group_id,created_by,status,created_at').eq('created_by', profileId).order('created_at', { ascending: false }),
    supabase.from('quiz_attempts').select('id,quiz_id,beneficiary_id,group_id,score_percent,status,completed_at,started_at').order('completed_at', { ascending: false, nullsFirst: false }),
    supabase.from('languages').select('id,name'),
    supabase.from('levels').select('id,name'),
  ]);

  const groups = await unwrap(groupsResult, 'Groupes');
  const resources = await unwrap(resourcesResult, 'Ressources');
  const remoteQuizzes = await unwrap(quizzesResult, 'Quizzes');
  const attempts = await unwrap(attemptsResult, 'Résultats');
  const languageMap = byId(await unwrap(languagesResult, 'Langues'));
  const levelMap = byId(await unwrap(levelsResult, 'Niveaux'));

  const groupIds = new Set(groups.map((group) => group.id));
  const ownerIds = new Set([profileId, user?.id, user?.authUserId].filter(Boolean));
  const quizzes = mergeQuizzes(remoteQuizzes, localData.quizzes).filter((quiz) => ownerIds.has(quiz.created_by) || groupIds.has(quiz.group_id));
  const visibleAttempts = attempts.filter((attempt) => groupIds.has(attempt.group_id));
  const quizMap = byId(quizzes);

  return {
    stats: {
      groups: groups.length,
      quizzes: quizzes.length,
      resources: resources.length,
      averageScore: percentAverage(visibleAttempts),
    },
    groups: groups.map((group) => {
      const groupAttempts = visibleAttempts.filter((attempt) => attempt.group_id === group.id);
      return {
        id: group.id,
        name: group.name,
        language: languageMap.get(group.language_id)?.name || '',
        level: levelMap.get(group.level_id)?.name || '',
        quizzes: quizzes.filter((quiz) => quiz.group_id === group.id).length,
        resources: resources.filter((resource) => resource.group_id === group.id).length,
        averageScore: percentAverage(groupAttempts),
      };
    }),
    recentResults: visibleAttempts.slice(0, 6).map((attempt) => ({
      id: attempt.id,
      quizTitle: quizMap.get(attempt.quiz_id)?.title || 'Quiz',
      score: Math.round(Number(attempt.score_percent) || 0),
      status: Number(attempt.score_percent) >= 50 ? 'réussi' : 'à améliorer',
    })),
  };
}

export async function fetchAdminDashboard(localData = {}) {
  const [profilesResult, groupsResult, resourcesResult, quizzesResult, attemptsResult, languagesResult, levelsResult] = await Promise.all([
    supabase.from('profiles').select('id,auth_user_id,full_name,email,role,created_at'),
    supabase.from('groups').select('id,name,language_id,level_id,intervenant_id,status,created_at'),
    supabase.from('resources').select('id,title,created_by,group_id,created_at'),
    supabase.from('quizzes').select('id,title,created_by,group_id,status,created_at'),
    supabase.from('quiz_attempts').select('id,quiz_id,beneficiary_id,group_id,score_percent,completed_at,started_at'),
    supabase.from('languages').select('id,name'),
    supabase.from('levels').select('id,name'),
  ]);

  const profiles = await unwrap(profilesResult, 'Profils');
  const groups = await unwrap(groupsResult, 'Groupes');
  const resources = await unwrap(resourcesResult, 'Ressources');
  const remoteQuizzes = await unwrap(quizzesResult, 'Quizzes');
  const attempts = await unwrap(attemptsResult, 'Résultats');
  const languageMap = byId(await unwrap(languagesResult, 'Langues'));
  const levelMap = byId(await unwrap(levelsResult, 'Niveaux'));
  const profileMap = byId(profiles);

  const intervenants = profiles.filter((profile) => profile.role === 'intervenant');
  const beneficiaries = profiles.filter((profile) => profile.role === 'beneficiaire');
  const quizzes = mergeQuizzes(remoteQuizzes, localData.quizzes);

  const byIntervenant = intervenants.map((intervenant) => ({
    name: nameOf(intervenant).split(' ')[0],
    fullName: nameOf(intervenant),
    quizzes: quizzes.filter((quiz) => quiz.created_by === intervenant.id || quiz.created_by === intervenant.auth_user_id).length,
    resources: resources.filter((resource) => resource.created_by === intervenant.id).length,
  }));
  const assignedQuizIds = new Set();
  byIntervenant.forEach((row, index) => {
    const intervenant = intervenants[index];
    quizzes.forEach((quiz) => {
      if (quiz.created_by === intervenant.id || quiz.created_by === intervenant.auth_user_id) assignedQuizIds.add(quiz.id);
    });
  });
  const unassignedQuizzes = quizzes.filter((quiz) => !assignedQuizIds.has(quiz.id)).length;
  if (unassignedQuizzes) byIntervenant.push({ name: 'Sans intervenant', fullName: 'Sans intervenant', quizzes: unassignedQuizzes, resources: 0 });

  const byLanguage = Array.from(languageMap.values()).map((language) => ({
    name: language.name,
    value: groups.filter((group) => group.language_id === language.id).length,
  }));

  const topGroups = groups.map((group) => {
    const groupAttempts = attempts.filter((attempt) => attempt.group_id === group.id);
    return {
      id: group.id,
      name: group.name,
      language: languageMap.get(group.language_id)?.name || '',
      level: levelMap.get(group.level_id)?.name || '',
      averageScore: percentAverage(groupAttempts),
    };
  }).sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);

  const resourceActivities = resources.map((resource) => ({
    id: `resource-${resource.id}`,
    date: resource.created_at,
    label: `${nameOf(profileMap.get(resource.created_by))} a ajouté la ressource ${resource.title}`,
  }));
  const quizActivities = quizzes.map((quiz) => ({
    id: `quiz-${quiz.id}`,
    date: quiz.created_at,
    label: `${nameOf(profileMap.get(quiz.created_by))} a créé le quiz ${quiz.title}`,
  }));
  const resultActivities = attempts.filter((attempt) => attempt.completed_at || attempt.started_at).map((attempt) => ({
    id: `attempt-${attempt.id}`,
    date: attempt.completed_at || attempt.started_at,
    label: `${nameOf(profileMap.get(attempt.beneficiary_id))} a terminé ${quizzes.find((quiz) => quiz.id === attempt.quiz_id)?.title || 'un quiz'} avec ${Math.round(Number(attempt.score_percent) || 0)}%`,
  }));

  return {
    stats: {
      beneficiaries: beneficiaries.length,
      intervenants: intervenants.length,
      groups: groups.length,
      quizzes: quizzes.length,
      resources: resources.length,
      averageScore: percentAverage(attempts),
    },
    byIntervenant,
    byLanguage,
    topGroups,
    activities: [...resourceActivities, ...quizActivities, ...resultActivities]
      .filter((activity) => activity.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
  };
}
