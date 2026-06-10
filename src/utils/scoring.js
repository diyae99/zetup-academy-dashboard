export function calculateScore(quiz, answers) {
  const correct = quiz.questions.reduce((count, question) => (
    answers[question.id] === question.correctAnswer ? count + 1 : count
  ), 0);
  const total = quiz.questions.length;
  return {
    correct,
    total,
    score: total ? Math.round((correct / total) * 100) : 0,
  };
}

export function scoreMessage(score) {
  if (score >= 80) return 'Excellent travail';
  if (score >= 50) return 'Bon effort, continuez';
  return 'À améliorer';
}

export function resultStatus(score) {
  return score >= 50 ? 'réussi' : 'à améliorer';
}
