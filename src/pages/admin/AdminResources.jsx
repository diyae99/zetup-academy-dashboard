import { useMemo, useState } from 'react';
import { useAppData } from '../../App';
import { languages, levels, resourceTypes } from '../../data/mockData';
import ResourceCard from '../../components/ResourceCard';

export default function AdminResources() {
  const { data } = useAppData();
  const [filters, setFilters] = useState({ type: '', language: '', level: '', groupId: '', intervenantId: '' });
  const rows = useMemo(() => data.resources.filter((r) => Object.entries(filters).every(([k, v]) => !v || r[k] === v)), [data.resources, filters]);
  const change = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-5">
        <select value={filters.type} onChange={change('type')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous types</option>{resourceTypes.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.language} onChange={change('language')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Toutes langues</option>{languages.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.level} onChange={change('level')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous niveaux</option>{levels.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.groupId} onChange={change('groupId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous groupes</option>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select value={filters.intervenantId} onChange={change('intervenantId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous intervenants</option>{data.intervenants.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((r) => <ResourceCard key={r.id} resource={r} groupName={data.groups.find((g) => g.id === r.groupId)?.name} intervenantName={data.intervenants.find((i) => i.id === r.intervenantId)?.name} />)}
      </div>
    </div>
  );
}
