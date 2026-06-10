import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../../App';

const blankQuestion = () => ({ id: `q-${Date.now()}-${Math.random()}`, type: 'QCM', text: '', options: ['', '', '', ''], correctAnswer: '' });

export default function CreateQuiz({ user }) {
  const { data, setData } = useAppData();
  const navigate = useNavigate();
  const myGroups = data.groups.filter((g) => g.intervenantId === user.id);
  const [quiz, setQuiz] = useState({ title: '', groupId: myGroups[0]?.id || '', questions: [blankQuestion()] });
  const selectedGroup = data.groups.find((g) => g.id === quiz.groupId) || myGroups[0];
  function save(status) {
    const cleanQuestions = quiz.questions.map((q) => q.type === 'Vrai/Faux' ? { ...q, options: ['Vrai', 'Faux'], correctAnswer: q.correctAnswer || 'Vrai' } : q);
    setData((d) => ({ ...d, quizzes: [...d.quizzes, { id: `quiz-${Date.now()}`, title: quiz.title || 'Quiz sans titre', language: selectedGroup.language, level: selectedGroup.level, groupId: quiz.groupId, createdBy: user.id, createdAt: new Date().toISOString().slice(0, 10), status, questions: cleanQuestions }] }));
    navigate('/intervenant/quizzes');
  }
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-4 md:grid-cols-2"><input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} placeholder="Titre du quiz" className="rounded-xl border border-slate-200 px-4 py-3" /><select value={quiz.groupId} onChange={(e) => setQuiz({ ...quiz, groupId: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3">{myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      </div>
      {quiz.questions.map((question, index) => <QuestionEditor key={question.id} index={index} question={question} setQuestion={(next) => setQuiz((q) => ({ ...q, questions: q.questions.map((item) => item.id === question.id ? next : item) }))} remove={() => setQuiz((q) => ({ ...q, questions: q.questions.filter((item) => item.id !== question.id) }))} />)}
      <div className="flex flex-wrap gap-3"><button onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, blankQuestion()] }))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold"><Plus size={18} /> Ajouter une question</button><button onClick={() => save('brouillon')} className="rounded-xl bg-amber-500 px-4 py-3 font-bold text-white">Enregistrer brouillon</button><button onClick={() => save('publié')} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Publier quiz</button></div>
    </div>
  );
}

function QuestionEditor({ question, index, setQuestion, remove }) {
  const set = (patch) => setQuestion({ ...question, ...patch });
  return <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><div className="flex items-center justify-between gap-3"><h3 className="font-black">Question {index + 1}</h3><button onClick={remove} className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={18} /></button></div><div className="mt-4 grid gap-4"><select value={question.type} onChange={(e) => set({ type: e.target.value, correctAnswer: e.target.value === 'Vrai/Faux' ? 'Vrai' : '' })} className="rounded-xl border border-slate-200 px-4 py-3"><option>QCM</option><option>Vrai/Faux</option></select><textarea value={question.text} onChange={(e) => set({ text: e.target.value })} placeholder="Texte de la question" className="min-h-24 rounded-xl border border-slate-200 px-4 py-3" />{question.type === 'QCM' ? <div className="grid gap-3">{question.options.map((option, i) => <div key={i} className="flex gap-3"><input value={option} onChange={(e) => { const options = [...question.options]; options[i] = e.target.value; set({ options }); }} placeholder={`Option ${i + 1}`} className="flex-1 rounded-xl border border-slate-200 px-4 py-3" /><label className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} checked={question.correctAnswer === option && option !== ''} onChange={() => set({ correctAnswer: option })} /> Correcte</label></div>)}</div> : <select value={question.correctAnswer} onChange={(e) => set({ correctAnswer: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3"><option>Vrai</option><option>Faux</option></select>}</div></section>;
}
