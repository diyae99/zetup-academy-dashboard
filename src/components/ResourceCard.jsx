import { Eye, FileAudio, FileText, Presentation, Trash2, Video } from 'lucide-react';
import Badge from './Badge';

const icons = {
  PDF: FileText,
  PPTX: Presentation,
  Word: FileText,
  'Video link': Video,
  Audio: FileAudio,
};

export default function ResourceCard({ resource, groupName, intervenantName, onOpen, onPreview, onDelete, opening = false, canDelete = false }) {
  const Icon = icons[resource.type] || FileText;
  const openLabel = resource.type === 'Video link' ? 'Ouvrir' : 'Ouvrir';
  const createdDate = resource.createdAt ? new Date(resource.createdAt).toLocaleDateString('fr-FR') : '';
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
            {createdDate && <span>{createdDate}</span>}
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={onOpen} disabled={opening} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Eye size={16} /> {opening ? 'Ouverture...' : openLabel}
            </button>
            <button onClick={onPreview} disabled={opening} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <Eye size={16} /> Prévisualiser
            </button>
            {canDelete && <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={16} /> Supprimer</button>}
          </div>
        </div>
      </div>
    </article>
  );
}
