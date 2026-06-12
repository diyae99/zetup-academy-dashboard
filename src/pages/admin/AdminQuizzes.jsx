import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '../../App';
import { fetchAllQuizzes } from '../../services/quizzes';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

export default function AdminQuizzes() {
  const { data } = useAppData();
  const [remoteQuizzes, setRemoteQuizzes] = useState([]);
  const [filters, setFilters] = useState({ language: '', level: '', groupId: '', createdBy: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchAllQuizzes()
      .then((quizzes) => {
        if (active) setRemoteQuizzes(quizzes);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement quizzes admin', loadError);
        if (active) setError(loadError.message || 'Impossible de charger les quizzes.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const allQuizzes = useMemo(() => {
    const byQuizId = new Map();
    [...remoteQuizzes, ...data.quizzes].forEach((quiz) => {
      if (quiz?.id && !byQuizId.has(quiz.id)) byQuizId.set(quiz.id, quiz);
    });
    return [...byQuizId.values()];
  }, [data.quizzes, remoteQuizzes]);

  const rows = useMemo(() => allQuizzes.filter((quiz) => (
    (!filters.language || quiz.language === filters.language) &&
    (!filters.level || quiz.level === filters.level) &&
    (!filters.groupId || quiz.groupId === filters.groupId) &&
    (!filters.createdBy || quiz.createdBy === filters.createdBy) &&
    (!filters.status || quiz.status === filters.status)
  )), [allQuizzes, filters]);

  const columns = [
    { key: 'title', label: 'Titre' },
    { key: 'language', label: 'Langue' },
    { key: 'level', label: 'Niveau' },
    { key: 'groupId', label: 'Groupe', render: (r) => r.groupName || data.groups.find((g) => g.id === r.groupId)?.name || 'Groupe' },
    { key: 'createdBy', label: 'Intervenant', render: (r) => r.createdByName || data.intervenants.find((i) => i.id === r.createdBy)?.name || 'Sans intervenant' },
    { key: 'questions', label: 'Questions', render: (r) => r.questions?.length || 0 },
    { key: 'score', label: 'Score moyen', render: (r) => `${Math.round(avg(data.quizResults.filter((x) => x.quizId === r.id).map((x) => x.score)))}%` },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
  ];
  return (
    <div className="space-y-5">
      {loading && <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des quizzes...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <FilterBar filters={filters} setFilters={setFilters} data={data} quizzes={allQuizzes} />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}

function avg(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function FilterBar({ filters, setFilters, data, quizzes }) {
  const change = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-5">
    <select value={filters.language} onChange={change('language')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Toutes langues</option>{uniqueValues(quizzes, 'language').map((x) => <option key={x}>{x}</option>)}</select>
    <select value={filters.level} onChange={change('level')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous niveaux</option>{uniqueValues(quizzes, 'level').map((x) => <option key={x}>{x}</option>)}</select>
    <select value={filters.groupId} onChange={change('groupId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous groupes</option>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
    <select value={filters.createdBy} onChange={change('createdBy')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous intervenants</option>{uniqueValues(quizzes, 'createdBy').map((id) => <option key={id} value={id}>{quizzes.find((quiz) => quiz.createdBy === id)?.createdByName || data.intervenants.find((i) => i.id === id)?.name || id}</option>)}</select>
    <select value={filters.status} onChange={change('status')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous statuts</option><option>brouillon</option><option>publié</option></select>
  </div>;
}
