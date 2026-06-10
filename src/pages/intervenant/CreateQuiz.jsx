import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../../App';

const blankQuestion = () => ({ id: `q-${Date.now()}-${Math.random()}`, type: 'QCM', text: '', options: ['', '', '', ''], correctAnswer: '' });

function validateQuiz(quiz, selectedGroup, status) {
  const errors = [];
  if (!quiz.title.trim() && status === 'publié') errors.push('Le titre du quiz est obligatoire avant publication.');
  if (!selectedGroup) errors.push('Aucun groupe valide n’est sélectionné pour ce quiz.');
  if (!quiz.questions.length) errors.push('Ajoutez au moins une question.');

  quiz.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.text.trim()) errors.push(`${label} : le texte de la question est obligatoire.`);
    if (question.type === 'QCM') {
      const options = question.options.map((option) => option.trim());
      if (options.some((option) => !option)) errors.push(`${label} : les 4 options QCM sont obligatoires.`);
      if (!options.includes(question.correctAnswer.trim())) errors.push(`${label} : sélectionnez une réponse correcte.`);
    }
    if (question.type === 'Vrai/Faux' && !['Vrai', 'Faux'].includes(question.correctAnswer)) {
      errors.push(`${label} : sélectionnez Vrai ou Faux comme réponse correcte.`);
    }
  });

  return errors;
}

function normalizeQuestions(questions) {
  return questions.map((question) => {
    if (question.type === 'Vrai/Faux') {
      return {
        ...question,
        text: question.text.trim(),
        options: ['Vrai', 'Faux'],
        correctAnswer: question.correctAnswer || 'Vrai',
      };
    }

    return {
      ...question,
      text: question.text.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswer: question.correctAnswer.trim(),
    };
  });
}

export default function CreateQuiz({ user }) {
  const { data, setData } = useAppData();
  const navigate = useNavigate();
  const myGroups = data.groups.filter((g) => g.intervenantId === user.id);
  const [quiz, setQuiz] = useState({ title: '', groupId: myGroups[0]?.id || '', questions: [blankQuestion()] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [publishing, setPublishing] = useState(false);
  const selectedGroup = data.groups.find((g) => g.id === quiz.groupId) || myGroups[0];

  function save(status) {
    setError('');
    setSuccess('');

    const validationErrors = validateQuiz(quiz, selectedGroup, status);
    if (validationErrors.length) {
      setError(validationErrors.join(' '));
      return;
    }

    try {
      if (status === 'publié') setPublishing(true);
      const cleanQuestions = normalizeQuestions(quiz.questions);
      const savedQuiz = {
        id: `quiz-${Date.now()}`,
        title: quiz.title.trim() || 'Quiz sans titre',
        language: selectedGroup.language,
        level: selectedGroup.level,
        groupId: selectedGroup.id,
        createdBy: user.id,
        createdAt: new Date().toISOString().slice(0, 10),
        status,
        questions: cleanQuestions,
      };

      setData((current) => ({ ...current, quizzes: [...current.quizzes, savedQuiz] }));
      setSuccess(status === 'publié' ? 'Quiz publié avec succès.' : 'Brouillon enregistré avec succès.');
      window.setTimeout(() => navigate('/intervenant/quizzes'), 600);
    } catch (saveError) {
      if (import.meta.env.DEV) console.error('Erreur publication quiz', saveError);
      setError('Impossible d’enregistrer le quiz. Vérifiez les champs puis réessayez.');
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div>}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-4 md:grid-cols-2"><input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} placeholder="Titre du quiz" className="rounded-xl border border-slate-200 px-4 py-3" /><select value={quiz.groupId} onChange={(e) => setQuiz({ ...quiz, groupId: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3" disabled={!myGroups.length}>{myGroups.length ? myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>) : <option value="">Aucun groupe assigné</option>}</select></div>
      </div>
      {quiz.questions.map((question, index) => <QuestionEditor key={question.id} index={index} question={question} setQuestion={(next) => setQuiz((q) => ({ ...q, questions: q.questions.map((item) => item.id === question.id ? next : item) }))} remove={() => setQuiz((q) => ({ ...q, questions: q.questions.filter((item) => item.id !== question.id) }))} />)}
      <div className="flex flex-wrap gap-3"><button disabled={publishing} onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, blankQuestion()] }))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60"><Plus size={18} /> Ajouter une question</button><button disabled={publishing} onClick={() => save('brouillon')} className="rounded-xl bg-amber-500 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">Enregistrer brouillon</button><button disabled={publishing} onClick={() => save('publié')} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{publishing ? 'Publication en cours...' : 'Publier quiz'}</button></div>
    </div>
  );
}

function QuestionEditor({ question, index, setQuestion, remove }) {
  const set = (patch) => setQuestion({ ...question, ...patch });
  return <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><div className="flex items-center justify-between gap-3"><h3 className="font-black">Question {index + 1}</h3><button onClick={remove} className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={18} /></button></div><div className="mt-4 grid gap-4"><select value={question.type} onChange={(e) => set({ type: e.target.value, correctAnswer: e.target.value === 'Vrai/Faux' ? 'Vrai' : '' })} className="rounded-xl border border-slate-200 px-4 py-3"><option>QCM</option><option>Vrai/Faux</option></select><textarea value={question.text} onChange={(e) => set({ text: e.target.value })} placeholder="Texte de la question" className="min-h-24 rounded-xl border border-slate-200 px-4 py-3" />{question.type === 'QCM' ? <div className="grid gap-3">{question.options.map((option, i) => <div key={i} className="flex gap-3"><input value={option} onChange={(e) => { const options = [...question.options]; options[i] = e.target.value; set({ options }); }} placeholder={`Option ${i + 1}`} className="flex-1 rounded-xl border border-slate-200 px-4 py-3" /><label className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} checked={question.correctAnswer === option && option !== ''} onChange={() => set({ correctAnswer: option })} /> Correcte</label></div>)}</div> : <select value={question.correctAnswer} onChange={(e) => set({ correctAnswer: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3"><option>Vrai</option><option>Faux</option></select>}</div></section>;
}
