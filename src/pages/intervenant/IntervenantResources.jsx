import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '../../App';
import { resourceTypes } from '../../data/mockData';
import ResourceCard from '../../components/ResourceCard';

export default function IntervenantResources({ user }) {
  const { data, setData } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const myGroups = data.groups.filter((g) => g.intervenantId === user.id);
  const rows = data.resources.filter((r) => r.intervenantId === user.id);
  function add(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const group = data.groups.find((g) => g.id === f.get('groupId'));
    setData((d) => ({ ...d, resources: [...d.resources, { id: `res-${Date.now()}`, title: f.get('title'), type: f.get('type'), language: group.language, level: group.level, groupId: group.id, intervenantId: user.id, url: f.get('url'), description: f.get('description'), createdAt: new Date().toISOString().slice(0, 10) }] }));
    event.currentTarget.reset();
    setShowForm(false);
  }
  return <div className="space-y-5"><button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white"><Plus size={18} /> Ajouter ressource</button>{showForm && <form onSubmit={add} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-2"><input name="title" required placeholder="Titre" className="rounded-xl border border-slate-200 px-4 py-3" /><select name="type" className="rounded-xl border border-slate-200 px-4 py-3">{resourceTypes.map((x) => <option key={x}>{x}</option>)}</select><select name="groupId" className="rounded-xl border border-slate-200 px-4 py-3">{myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><input name="url" required placeholder="URL ou nom de fichier mock" className="rounded-xl border border-slate-200 px-4 py-3" /><textarea name="description" placeholder="Description" className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" /><button className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white md:col-span-2">Enregistrer la ressource</button></form>}<div className="grid gap-4 xl:grid-cols-2">{rows.map((r) => <ResourceCard key={r.id} resource={r} groupName={data.groups.find((g) => g.id === r.groupId)?.name} />)}</div></div>;
}
