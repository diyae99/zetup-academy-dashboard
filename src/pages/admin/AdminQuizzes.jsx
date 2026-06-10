import { useMemo, useState } from 'react';
import { useAppData } from '../../App';
import { languages, levels } from '../../data/mockData';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

export default function AdminQuizzes() {
  const { data } = useAppData();
  const [filters, setFilters] = useState({ language: '', level: '', groupId: '', createdBy: '', status: '' });
  const rows = useMemo(() => data.quizzes.filter((q) => Object.entries(filters).every(([k, v]) => !v || q[k] === v)), [data.quizzes, filters]);
  const columns = [
    { key: 'title', label: 'Titre' },
    { key: 'language', label: 'Langue' },
    { key: 'level', label: 'Niveau' },
    { key: 'groupId', label: 'Groupe', render: (r) => data.groups.find((g) => g.id === r.groupId)?.name },
    { key: 'createdBy', label: 'Intervenant', render: (r) => data.intervenants.find((i) => i.id === r.createdBy)?.name },
    { key: 'questions', label: 'Questions', render: (r) => r.questions.length },
    { key: 'score', label: 'Score moyen', render: (r) => `${Math.round(avg(data.quizResults.filter((x) => x.quizId === r.id).map((x) => x.score)))}%` },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
  ];
  return (
    <div className="space-y-5">
      <FilterBar filters={filters} setFilters={setFilters} data={data} />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}

function avg(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function FilterBar({ filters, setFilters, data }) {
  const change = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-5">
    <select value={filters.language} onChange={change('language')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Toutes langues</option>{languages.map((x) => <option key={x}>{x}</option>)}</select>
    <select value={filters.level} onChange={change('level')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous niveaux</option>{levels.map((x) => <option key={x}>{x}</option>)}</select>
    <select value={filters.groupId} onChange={change('groupId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous groupes</option>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
    <select value={filters.createdBy} onChange={change('createdBy')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous intervenants</option>{data.intervenants.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
    <select value={filters.status} onChange={change('status')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous statuts</option><option>brouillon</option><option>publié</option></select>
  </div>;
}
