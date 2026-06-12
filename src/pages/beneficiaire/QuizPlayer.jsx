import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../../App';
import { loadBeneficiaryWorkspace } from '../../services/beneficiary';
import { calculateScore, scoreMessage } from '../../utils/scoring';

export default function QuizPlayer({ user }) {
  const { quizId } = useParams();
  const { data, setData } = useAppData();
  const [workspace, setWorkspace] = useState({ quizzes: [], groups: [], results: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    loadBeneficiaryWorkspace(user, data)
      .then((loaded) => {
        if (!active) return;
        setWorkspace(loaded);
        setResult(loaded.results.find((item) => item.quizId === quizId) || null);
      })
      .catch((error) => active && setLoadError(error.message || 'Quiz indisponible.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, data, quizId]);

  const quiz = useMemo(() => {
    const local = data.quizzes.find((item) => item.id === quizId);
    const visible = workspace.quizzes.find((item) => item.id === quizId);
    return local || visible;
  }, [data.quizzes, quizId, workspace.quizzes]);
  const group = workspace.groups.find((g) => g.id === quiz?.groupId);
  const allowed = !!quiz && workspace.quizzes.some((item) => item.id === quiz.id);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Chargement du quiz...</div>;
  if (loadError || !quiz || !allowed) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Quiz indisponible.</div>;
  if (!quiz.questions?.length) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Ce quiz ne contient pas encore de questions disponibles.</div>;

  function submit() {
    const scored = calculateScore(quiz, answers);
    const saved = { id: `r-${Date.now()}`, beneficiaryId: user.profileId || user.id, groupId: quiz.groupId, quizId: quiz.id, score: scored.score, correct: scored.correct, total: scored.total, date: new Date().toISOString().slice(0, 10) };
    setResult(saved);
    setData((current) => ({ ...current, quizResults: [...current.quizResults.filter((item) => !(item.quizId === quiz.id && (item.beneficiaryId === user.id || item.beneficiaryId === user.profileId))), saved] }));
  }

  if (result) return <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70"><p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Résultat immédiat</p><h2 className="mt-3 text-5xl font-black text-slate-950">{result.score}%</h2><p className="mt-3 text-lg font-bold text-slate-800">{scoreMessage(result.score)}</p><p className="mt-2 text-slate-500">{result.correct} bonnes réponses sur {result.total}</p><Link to="/beneficiaire/quizzes" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Retour aux quizzes</Link></div>;
  return <div className="mx-auto max-w-3xl space-y-5"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-2xl font-black">{quiz.title}</h2><p className="mt-1 text-slate-500">{group?.name} · {quiz.language} · {quiz.level}</p></div>{quiz.questions.map((q, index) => <section key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-bold">Question {index + 1}</h3><p className="mt-2 text-slate-800">{q.text}</p><div className="mt-4 grid gap-2">{(q.type === 'QCM' ? q.options : ['Vrai', 'Faux']).map((option) => <label key={option} className={`rounded-xl border px-4 py-3 ${answers[q.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}><input className="mr-2" type="radio" name={q.id} checked={answers[q.id] === option} onChange={() => setAnswers((current) => ({ ...current, [q.id]: option }))} /> {option}</label>)}</div></section>)}<button onClick={submit} className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white">Soumettre le quiz</button></div>;
}
