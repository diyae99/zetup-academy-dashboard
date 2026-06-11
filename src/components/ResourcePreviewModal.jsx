import { X } from 'lucide-react';

export default function ResourcePreviewModal({ resource, url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-black text-slate-900">{resource.title}</h3>
            <p className="text-sm font-semibold text-slate-500">{resource.type}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="min-h-80 flex-1 bg-slate-50 p-4">
          {resource.type === 'PDF' && <iframe title={resource.title} src={url} className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" />}
          {resource.type === 'Audio' && <div className="flex h-80 items-center justify-center"><audio src={url} controls className="w-full max-w-2xl" /></div>}
          {!['PDF', 'Audio'].includes(resource.type) && <div className="rounded-xl bg-white p-5 text-sm font-semibold text-slate-600">Prévisualisation non disponible pour ce type de ressource.</div>}
        </div>
      </div>
    </div>
  );
}
