import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FilePlus2, FileText, Target, UsersRound } from 'lucide-react';
import { useAppData } from '../../App';
import { fetchIntervenantDashboard } from '../../services/dashboards';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

const emptyDashboard = {
  stats: { groups: 0, quizzes: 0, resources: 0, averageScore: 0 },
  groups: [],
  recentResults: [],
};

export default function IntervenantDashboard({ user }) {
  const { data } = useAppData();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchIntervenantDashboard(user, data)
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur dashboard intervenant', loadError);
        if (active) setError(loadError.message || 'Impossible de charger le tableau de bord.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, data]);

  const { stats, groups, recentResults } = dashboard;

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement du tableau de bord...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4"><StatCard title="Mes groupes" value={stats.groups} icon={BookOpen} /><StatCard title="Quizzes créés" value={stats.quizzes} icon={ClipboardList} tone="cyan" /><StatCard title="Resources ajoutées" value={stats.resources} icon={FileText} tone="emerald" /><StatCard title="Score moyen" value={`${stats.averageScore}%`} icon={Target} tone="amber" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><Link to="/intervenant/creer-quiz" className="flex items-center gap-3 rounded-2xl bg-indigo-600 p-5 font-bold text-white"><ClipboardList /> Créer quiz</Link><Link to="/intervenant/resources" className="flex items-center gap-3 rounded-2xl bg-cyan-600 p-5 font-bold text-white"><FilePlus2 /> Ajouter ressource</Link></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GroupList groups={groups} />
        <DataTable columns={[{ key: 'quizTitle', label: 'Quiz' }, { key: 'score', label: 'Score', render: (r) => `${r.score}%` }, { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> }]} rows={recentResults} />
      </div>
    </div>
  );
}

function GroupList({ groups }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-bold text-slate-900">Mes groupes</h3><div className="mt-4 space-y-3">{groups.length ? groups.map((g) => <div key={g.id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{g.name}</p><p className="mt-1 text-sm text-slate-500"><UsersRound size={15} className="mr-1 inline" /> {g.resources} ressources · {g.quizzes} quizzes · {g.averageScore}% moyen</p><p className="mt-1 text-xs font-semibold text-slate-400">{g.language} · {g.level}</p></div>) : <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Aucun groupe ne vous est encore assigné.</p>}</div></div>;
}
