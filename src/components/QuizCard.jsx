import { Link } from 'react-router-dom';
import { ClipboardList, PlayCircle } from 'lucide-react';
import Badge from './Badge';

export default function QuizCard({ quiz, groupName, result, startPath, adminView }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <ClipboardList size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{quiz.title}</h3>
            <Badge>{quiz.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">{quiz.language} · {quiz.level} · {groupName}</p>
          <p className="mt-3 text-sm text-slate-600">{quiz.questions.length} questions</p>
          {result && <p className="mt-3 text-sm font-semibold text-emerald-600">Score obtenu : {result.score}%</p>}
          {!adminView && quiz.status === 'publié' && !result && startPath && (
            <Link to={startPath} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <PlayCircle size={16} /> Commencer
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
