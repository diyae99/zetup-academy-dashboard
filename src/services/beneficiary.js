import { supabase } from '../lib/supabaseClient';
import { normalizeResource } from './resources';

function byId(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function percentAverage(items) {
  const scores = (items || []).map((item) => Number(item.score_percent ?? item.score)).filter(Number.isFinite);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function normalizeLocalQuiz(quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    groupId: quiz.groupId || quiz.group_id,
    language: quiz.language || '',
    level: quiz.level || '',
    status: quiz.status,
    questions: quiz.questions || [],
  };
}

export async function loadBeneficiaryWorkspace(user, localData = {}) {
  const profileId = user?.profileId;
  if (!profileId) throw new Error('Profil bénéficiaire introuvable. Veuillez vous reconnecter.');

  const [membershipsResult, groupsResult, languagesResult, levelsResult, profilesResult, resourcesResult, quizzesResult, attemptsResult] = await Promise.all([
    supabase.from('group_members').select('group_id,status').eq('beneficiary_id', profileId),
    supabase.from('groups').select('id,name,language_id,level_id,intervenant_id,status'),
    supabase.from('languages').select('id,name'),
    supabase.from('levels').select('id,name'),
    supabase.from('profiles').select('id,full_name,email,role'),
    supabase.from('resources').select('id,title,description,resource_type,resource_url,storage_path,language_id,level_id,group_id,created_by,status,created_at'),
    supabase.from('quizzes').select('id,title,language_id,level_id,group_id,created_by,status,created_at'),
    supabase.from('quiz_attempts').select('id,quiz_id,beneficiary_id,group_id,score_percent,status,completed_at,started_at').eq('beneficiary_id', profileId),
  ]);

  const required = [
    [membershipsResult, 'Groupes bénéficiaire'],
    [groupsResult, 'Groupes'],
    [languagesResult, 'Langues'],
    [levelsResult, 'Niveaux'],
    [profilesResult, 'Profils'],
    [resourcesResult, 'Ressources'],
    [quizzesResult, 'Quizzes'],
    [attemptsResult, 'Résultats'],
  ];
  const failed = required.find(([result]) => result.error);
  if (failed) throw new Error(`${failed[1]}: ${failed[0].error.message}`);

  const activeGroupIds = new Set((membershipsResult.data || []).filter((item) => item.status !== 'removed').map((item) => item.group_id));
  const languageMap = byId(languagesResult.data);
  const levelMap = byId(levelsResult.data);
  const profileMap = byId(profilesResult.data);
  const groups = (groupsResult.data || []).filter((group) => activeGroupIds.has(group.id)).map((group) => ({
    id: group.id,
    name: group.name,
    languageId: group.language_id,
    levelId: group.level_id,
    language: languageMap.get(group.language_id)?.name || '',
    level: levelMap.get(group.level_id)?.name || '',
    intervenantId: group.intervenant_id,
    intervenantName: profileMap.get(group.intervenant_id)?.full_name || profileMap.get(group.intervenant_id)?.email || '',
  }));

  const resources = (resourcesResult.data || []).filter((resource) => activeGroupIds.has(resource.group_id)).map((resource) => normalizeResource(resource, groups));
  const remoteQuizzes = (quizzesResult.data || []).filter((quiz) => activeGroupIds.has(quiz.group_id)).map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    groupId: quiz.group_id,
    language: languageMap.get(quiz.language_id)?.name || '',
    level: levelMap.get(quiz.level_id)?.name || '',
    status: quiz.status,
    questions: [],
  }));
  const localQuizzes = (localData.quizzes || []).map(normalizeLocalQuiz).filter((quiz) => activeGroupIds.has(quiz.groupId) && quiz.status === 'publié');
  const quizById = new Map([...remoteQuizzes, ...localQuizzes].map((quiz) => [quiz.id, quiz]));
  const quizzes = [...quizById.values()];
  const results = (attemptsResult.data || []).map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quiz_id,
    groupId: attempt.group_id,
    score: Math.round(Number(attempt.score_percent) || 0),
    date: attempt.completed_at || attempt.started_at || '',
  }));
  const localResults = (localData.quizResults || []).filter((result) => result.beneficiaryId === user.id || result.beneficiaryId === profileId);

  return {
    groups,
    resources,
    quizzes,
    results: [...results, ...localResults],
    averageScore: percentAverage([...results, ...localResults]),
  };
}
