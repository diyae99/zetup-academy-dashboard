import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../../App';
import { calculateScore, scoreMessage } from '../../utils/scoring';

export default function QuizPlayer({ user }) {
  const { quizId } = useParams();
  const { data, setData } = useAppData();
  const quiz = data.quizzes.find((q) => q.id === quizId);
  const existing = data.quizResults.find((r) => r.quizId === quizId && r.beneficiaryId === user.id);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(existing || null);
  const group = data.groups.find((g) => g.id === quiz?.groupId);
  const allowed = useMemo(() => data.beneficiaries.find((b) => b.id === user.id)?.groupIds.includes(quiz?.groupId), [data.beneficiaries, quiz, user.id]);
  if (!quiz || !allowed) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Quiz indisponible.</div>;
  function submit() {
    const scored = calculateScore(quiz, answers);
    const saved = { id: `r-${Date.now()}`, beneficiaryId: user.id, groupId: quiz.groupId, quizId: quiz.id, score: scored.score, correct: scored.correct, total: scored.total, date: new Date().toISOString().slice(0, 10) };
    setResult(saved);
    if (!existing) setData((d) => ({ ...d, quizResults: [...d.quizResults, saved] }));
  }
  if (result) return <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70"><p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Résultat immédiat</p><h2 className="mt-3 text-5xl font-black text-slate-950">{result.score}%</h2><p className="mt-3 text-lg font-bold text-slate-800">{scoreMessage(result.score)}</p><p className="mt-2 text-slate-500">{result.correct} bonnes réponses sur {result.total}</p><Link to="/beneficiaire/quizzes" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Retour aux quizzes</Link></div>;
  return <div className="mx-auto max-w-3xl space-y-5"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-2xl font-black">{quiz.title}</h2><p className="mt-1 text-slate-500">{group?.name} · {quiz.language} · {quiz.level}</p></div>{quiz.questions.map((q, index) => <section key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-bold">Question {index + 1}</h3><p className="mt-2 text-slate-800">{q.text}</p><div className="mt-4 grid gap-2">{(q.type === 'QCM' ? q.options : ['Vrai', 'Faux']).map((option) => <label key={option} className={`rounded-xl border px-4 py-3 ${answers[q.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}><input className="mr-2" type="radio" name={q.id} checked={answers[q.id] === option} onChange={() => setAnswers((a) => ({ ...a, [q.id]: option }))} /> {option}</label>)}</div></section>)}<button onClick={submit} className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white">Soumettre le quiz</button></div>;
}
