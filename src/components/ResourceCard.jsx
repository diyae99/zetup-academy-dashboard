import { Eye, FileAudio, FileText, Presentation, Video } from 'lucide-react';
import Badge from './Badge';

const icons = {
  PDF: FileText,
  PPTX: Presentation,
  Word: FileText,
  'Video link': Video,
  Audio: FileAudio,
};

export default function ResourceCard({ resource, groupName, intervenantName }) {
  const Icon = icons[resource.type] || FileText;
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{resource.title}</h3>
            <Badge>{resource.type}</Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{resource.description}</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span>{resource.language} · {resource.level}</span>
            <span>{groupName}</span>
            {intervenantName && <span>{intervenantName}</span>}
          </div>
          <div className="mt-5 flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Eye size={16} /> Voir
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Eye size={16} /> Prévisualiser
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
