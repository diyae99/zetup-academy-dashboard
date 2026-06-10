import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '../../App';
import { languages, levels } from '../../data/mockData';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';

export default function AdminGroups() {
  const { data, setData } = useAppData();
  const [open, setOpen] = useState(false);
  function add(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setData((d) => ({ ...d, groups: [...d.groups, { id: `grp-${Date.now()}`, name: f.get('name'), language: f.get('language'), level: f.get('level'), intervenantId: f.get('intervenantId'), beneficiaryIds: f.getAll('beneficiaries'), averageScore: 0, status: 'actif' }] }));
    setOpen(false);
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white"><Plus size={18} /> Ajouter un groupe</button></div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {data.groups.map((g) => {
          const int = data.intervenants.find((i) => i.id === g.intervenantId);
          return <article key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{g.language} · {g.level} · {int?.name}</p></div><Badge>{g.status}</Badge></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Info label="Bénéficiaires" value={g.beneficiaryIds.length} />
              <Info label="Quizzes" value={data.quizzes.filter((q) => q.groupId === g.id).length} />
              <Info label="Resources" value={data.resources.filter((r) => r.groupId === g.id).length} />
              <Info label="Score moyen" value={`${g.averageScore}%`} />
            </div>
          </article>;
        })}
      </div>
      {open && <Modal title="Ajouter un groupe" onClose={() => setOpen(false)}><GroupForm onSubmit={add} data={data} /></Modal>}
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black text-slate-900">{value}</p></div>;
}

function GroupForm({ onSubmit, data }) {
  return <form onSubmit={onSubmit} className="grid gap-4">
    <input name="name" required placeholder="Nom du groupe" className="rounded-xl border border-slate-200 px-4 py-3" />
    <div className="grid gap-4 sm:grid-cols-2"><select name="language" className="rounded-xl border border-slate-200 px-4 py-3">{languages.map((x) => <option key={x}>{x}</option>)}</select><select name="level" className="rounded-xl border border-slate-200 px-4 py-3">{levels.map((x) => <option key={x}>{x}</option>)}</select></div>
    <select name="intervenantId" className="rounded-xl border border-slate-200 px-4 py-3">{data.intervenants.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
    <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">Bénéficiaires</legend>{data.beneficiaries.map((b) => <label key={b.id} className="mb-2 block text-sm"><input type="checkbox" name="beneficiaries" value={b.id} /> {b.name}</label>)}</fieldset>
    <button className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Créer le groupe</button>
  </form>;
}
