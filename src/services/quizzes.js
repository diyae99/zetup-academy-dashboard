import { supabase } from '../lib/supabaseClient';

const DB_STATUS = {
  brouillon: 'draft',
  publié: 'published',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
};

const DISPLAY_STATUS = {
  draft: 'brouillon',
  published: 'publié',
  archived: 'archivé',
};

function byId(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function displayStatus(status) {
  return DISPLAY_STATUS[status] || status || 'brouillon';
}

function dbStatus(status) {
  return DB_STATUS[status] || 'draft';
}

export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeQuestion(question, options = []) {
  if (question.question_type === 'true_false') {
    return {
      id: question.id,
      type: 'Vrai/Faux',
      text: question.question_text,
      options: ['Vrai', 'Faux'],
      correctAnswer: question.true_false_answer ? 'Vrai' : 'Faux',
      sortOrder: question.sort_order || 0,
    };
  }

  const orderedOptions = [...options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const correct = orderedOptions.find((option) => option.is_correct);
  return {
    id: question.id,
    type: 'QCM',
    text: question.question_text,
    options: orderedOptions.map((option) => option.option_text),
    optionIds: Object.fromEntries(orderedOptions.map((option) => [option.option_text, option.id])),
    correctOptionId: correct?.id || null,
    correctAnswer: correct?.option_text || '',
    sortOrder: question.sort_order || 0,
  };
}

function scoreSubmittedAnswers(quiz, answers) {
  const total = quiz.questions?.length || 0;
  const correct = (quiz.questions || []).reduce((count, question) => {
    if (question.type === 'QCM') {
      const selectedOptionId = question.optionIds?.[answers[question.id]] || null;
      return selectedOptionId && selectedOptionId === question.correctOptionId ? count + 1 : count;
    }
    return answers[question.id] === question.correctAnswer ? count + 1 : count;
  }, 0);

  return {
    correct,
    total,
    score: total ? Math.round((correct / total) * 100) : 0,
  };
}

export function normalizeQuiz(row, lookups = {}, questions = []) {
  const languageMap = lookups.languageMap || new Map();
  const levelMap = lookups.levelMap || new Map();
  const groupMap = lookups.groupMap || new Map();
  const profileMap = lookups.profileMap || new Map();
  const group = groupMap.get(row.group_id);
  const languageId = row.language_id || group?.language_id;
  const levelId = row.level_id || group?.level_id;
  const creator = profileMap.get(row.created_by);

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    groupId: row.group_id,
    languageId,
    levelId,
    language: languageMap.get(languageId)?.name || row.language || '',
    level: levelMap.get(levelId)?.name || row.level || '',
    groupName: group?.name || '',
    createdBy: row.created_by,
    createdByName: creator?.full_name || creator?.email || '',
    createdAt: row.created_at,
    status: displayStatus(row.status),
    dbStatus: row.status,
    questions: questions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  };
}

export async function loadQuizQuestions(quizIds) {
  const ids = [...new Set((quizIds || []).filter(isUuid))];
  if (!ids.length) return new Map();

  const questionsResult = await supabase
    .from('quiz_questions')
    .select('id,quiz_id,question_text,question_type,true_false_answer,points,sort_order')
    .in('quiz_id', ids)
    .order('sort_order');
  if (questionsResult.error) throw new Error(`Questions quiz: ${questionsResult.error.message}`);

  const questionIds = (questionsResult.data || []).map((question) => question.id);
  const optionsResult = questionIds.length
    ? await supabase.from('quiz_options').select('id,question_id,option_text,is_correct,sort_order').in('question_id', questionIds).order('sort_order')
    : { data: [], error: null };
  if (optionsResult.error) throw new Error(`Options quiz: ${optionsResult.error.message}`);

  const optionsByQuestion = new Map();
  (optionsResult.data || []).forEach((option) => {
    const current = optionsByQuestion.get(option.question_id) || [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  });

  const questionsByQuiz = new Map();
  (questionsResult.data || []).forEach((question) => {
    const current = questionsByQuiz.get(question.quiz_id) || [];
    current.push(normalizeQuestion(question, optionsByQuestion.get(question.id) || []));
    questionsByQuiz.set(question.quiz_id, current);
  });
  return questionsByQuiz;
}

async function loadLookupsForQuizzes(quizzes) {
  const languageIds = quizzes.map((quiz) => quiz.language_id).filter(Boolean);
  const levelIds = quizzes.map((quiz) => quiz.level_id).filter(Boolean);
  const groupIds = quizzes.map((quiz) => quiz.group_id).filter(Boolean);
  const creatorIds = quizzes.map((quiz) => quiz.created_by).filter(Boolean);

  const [languagesResult, levelsResult, groupsResult, profilesResult] = await Promise.all([
    languageIds.length ? supabase.from('languages').select('id,name').in('id', [...new Set(languageIds)]) : { data: [], error: null },
    levelIds.length ? supabase.from('levels').select('id,name').in('id', [...new Set(levelIds)]) : { data: [], error: null },
    groupIds.length ? supabase.from('groups').select('id,name,language_id,level_id,intervenant_id').in('id', [...new Set(groupIds)]) : { data: [], error: null },
    creatorIds.length ? supabase.from('profiles').select('id,full_name,email,role').in('id', [...new Set(creatorIds)]) : { data: [], error: null },
  ]);

  const failed = [
    [languagesResult, 'Langues'],
    [levelsResult, 'Niveaux'],
    [groupsResult, 'Groupes'],
    [profilesResult, 'Profils'],
  ].find(([result]) => result.error);
  if (failed) throw new Error(`${failed[1]}: ${failed[0].error.message}`);

  return {
    languageMap: byId(languagesResult.data),
    levelMap: byId(levelsResult.data),
    groupMap: byId(groupsResult.data),
    profileMap: byId(profilesResult.data),
  };
}

export async function fetchAllQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id,title,description,language_id,level_id,group_id,created_by,status,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Impossible de charger les quizzes: ${error.message}`);

  const quizzes = data || [];
  const [lookups, questionsByQuiz] = await Promise.all([
    loadLookupsForQuizzes(quizzes),
    loadQuizQuestions(quizzes.map((quiz) => quiz.id)),
  ]);
  return quizzes.map((quiz) => normalizeQuiz(quiz, lookups, questionsByQuiz.get(quiz.id) || []));
}

export async function fetchQuizzesForIntervenant(user) {
  const profileId = user?.profileId;
  if (!profileId) throw new Error('Profil intervenant introuvable. Veuillez vous reconnecter.');

  const { data, error } = await supabase
    .from('quizzes')
    .select('id,title,description,language_id,level_id,group_id,created_by,status,created_at')
    .eq('created_by', profileId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Impossible de charger vos quizzes: ${error.message}`);

  const quizzes = data || [];
  const [lookups, questionsByQuiz] = await Promise.all([
    loadLookupsForQuizzes(quizzes),
    loadQuizQuestions(quizzes.map((quiz) => quiz.id)),
  ]);
  return quizzes.map((quiz) => normalizeQuiz(quiz, lookups, questionsByQuiz.get(quiz.id) || []));
}

export async function createQuizWithQuestions({ user, quiz, selectedGroup, status }) {
  if (!user?.profileId) throw new Error('Profil intervenant introuvable. Veuillez vous reconnecter.');
  if (!selectedGroup?.id) throw new Error('Aucun groupe valide n’est sélectionné pour ce quiz.');

  const quizInsert = {
    title: quiz.title.trim() || 'Quiz sans titre',
    language_id: selectedGroup.languageId,
    level_id: selectedGroup.levelId,
    group_id: selectedGroup.id,
    created_by: user.profileId,
    status: dbStatus(status),
  };

  const { data: createdQuiz, error: quizError } = await supabase
    .from('quizzes')
    .insert(quizInsert)
    .select('id,title,description,language_id,level_id,group_id,created_by,status,created_at')
    .single();
  if (quizError) throw new Error(`Création du quiz: ${quizError.message}`);

  try {
    const questionRows = quiz.questions.map((question, index) => ({
      quiz_id: createdQuiz.id,
      question_text: question.text.trim(),
      question_type: question.type === 'Vrai/Faux' ? 'true_false' : 'qcm',
      true_false_answer: question.type === 'Vrai/Faux' ? question.correctAnswer === 'Vrai' : null,
      points: 1,
      sort_order: index + 1,
    }));

    const { data: createdQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionRows)
      .select('id,quiz_id,question_text,question_type,true_false_answer,points,sort_order');
    if (questionsError) throw new Error(`Questions: ${questionsError.message}`);

    const optionRows = [];
    createdQuestions.forEach((createdQuestion, index) => {
      const source = quiz.questions[index];
      if (source.type !== 'QCM') return;
      source.options.forEach((option, optionIndex) => {
        optionRows.push({
          question_id: createdQuestion.id,
          option_text: option.trim(),
          is_correct: option.trim() === source.correctAnswer.trim(),
          sort_order: optionIndex + 1,
        });
      });
    });

    if (optionRows.length) {
      const { error: optionsError } = await supabase.from('quiz_options').insert(optionRows);
      if (optionsError) throw new Error(`Options: ${optionsError.message}`);
    }

    const lookups = await loadLookupsForQuizzes([createdQuiz]);
    const questionsByQuiz = await loadQuizQuestions([createdQuiz.id]);
    return normalizeQuiz(createdQuiz, lookups, questionsByQuiz.get(createdQuiz.id) || []);
  } catch (error) {
    await supabase.from('quizzes').delete().eq('id', createdQuiz.id);
    throw error;
  }
}

export async function submitQuizAttempt({ user, quiz, answers, scored }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error('Session bénéficiaire introuvable. Veuillez vous reconnecter.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,auth_user_id,role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (profileError) throw new Error(`Profil bénéficiaire: ${profileError.message}`);
  if (!profile || profile.role !== 'beneficiaire') throw new Error('Profil bénéficiaire introuvable. Veuillez vous reconnecter.');

  const beneficiaryId = profile.id;
  if (!quiz?.id || !quiz?.groupId) throw new Error('Quiz invalide.');
  if (!isUuid(quiz.id) || !isUuid(quiz.groupId) || !isUuid(beneficiaryId)) {
    if (import.meta.env.DEV) {
      console.error('Soumission quiz bloquée: identifiants non UUID', {
        authUserId: authData.user.id,
        quizId: quiz.id,
        groupId: quiz.groupId,
        beneficiaryId,
      });
    }
    throw new Error("Impossible d'enregistrer le résultat. Veuillez réessayer.");
  }

  const invalidQuestion = quiz.questions.find((question) => !isUuid(question.id));
  if (invalidQuestion) {
    if (import.meta.env.DEV) console.error('Soumission quiz bloquée: question non UUID', invalidQuestion);
    throw new Error("Impossible d'enregistrer le résultat. Veuillez réessayer.");
  }

  const invalidSelectedOption = quiz.questions.find((question) => (
    question.type === 'QCM' && !isUuid(question.optionIds?.[answers[question.id]])
  ));
  if (invalidSelectedOption) {
    if (import.meta.env.DEV) {
      console.error('Soumission quiz bloquée: option sélectionnée non UUID', {
        question: invalidSelectedOption,
        selectedAnswer: answers[invalidSelectedOption.id],
      });
    }
    throw new Error("Impossible d'enregistrer le résultat. Veuillez réessayer.");
  }

  const finalScore = scoreSubmittedAnswers(quiz, answers);
  const attemptPayload = {
    quiz_id: quiz.id,
    beneficiary_id: beneficiaryId,
    group_id: quiz.groupId,
    total_questions: finalScore.total,
    correct_answers: finalScore.correct,
    score_percent: finalScore.score,
    status: 'completed',
    completed_at: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.info('Soumission quiz - payload tentative', {
      authUserId: authData.user.id,
      profileId: beneficiaryId,
      userPropProfileId: user?.profileId,
      quizId: quiz.id,
      groupId: quiz.groupId,
      answers,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        type: question.type,
        optionIds: question.optionIds || null,
        correctOptionId: question.correctOptionId || null,
        correctAnswer: question.correctAnswer,
      })),
      calculatedScoreFromPage: scored,
      calculatedScoreForInsert: finalScore,
      attemptPayload,
    });
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert(attemptPayload)
    .select('id,quiz_id,beneficiary_id,group_id,score_percent,status,completed_at,started_at')
    .single();
  if (attemptError) {
    if (import.meta.env.DEV) console.error('Erreur insertion quiz_attempts', { attemptPayload, attemptError });
    throw new Error(`Enregistrement du résultat: ${attemptError.message}`);
  }

  const answerRows = quiz.questions.map((question) => ({
    attempt_id: attempt.id,
    question_id: question.id,
    selected_option_id: question.type === 'QCM' ? question.optionIds?.[answers[question.id]] || null : null,
    boolean_answer: question.type === 'Vrai/Faux' ? answers[question.id] === 'Vrai' : null,
    is_correct: question.type === 'QCM'
      ? question.optionIds?.[answers[question.id]] === question.correctOptionId
      : answers[question.id] === question.correctAnswer,
  }));

  if (import.meta.env.DEV) console.info('Soumission quiz - payload réponses', { attempt, answerRows });

  if (answerRows.length) {
    const { error: answersError } = await supabase.from('quiz_answers').insert(answerRows);
    if (answersError) {
      if (import.meta.env.DEV) console.error('Erreur insertion quiz_answers', { answerRows, answersError });
      throw new Error(`Réponses quiz: ${answersError.message}`);
    }
  }

  return {
    id: attempt.id,
    beneficiaryId: attempt.beneficiary_id,
    groupId: attempt.group_id,
    quizId: attempt.quiz_id,
    score: Math.round(Number(attempt.score_percent) || 0),
    correct: finalScore.correct,
    total: finalScore.total,
    date: attempt.completed_at || attempt.started_at || '',
  };
}
