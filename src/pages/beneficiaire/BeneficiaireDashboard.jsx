import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FileText, TrendingUp } from 'lucide-react';
import { useAppData } from '../../App';
import { loadBeneficiaryWorkspace } from '../../services/beneficiary';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';

export default function BeneficiaireDashboard({ user }) {
  const { data } = useAppData();
  const [workspace, setWorkspace] = useState({ groups: [], quizzes: [], resources: [], results: [], averageScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadBeneficiaryWorkspace(user, data)
      .then((loaded) => {
        if (active) setWorkspace(loaded);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur espace bénéficiaire', loadError);
        if (active) setError(loadError.message || 'Impossible de charger votre espace.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, data]);

  return <div className="space-y-6">{loading && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement de votre espace...</div>}{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}<div className="grid gap-4 md:grid-cols-4"><StatCard title="Mes groupes" value={workspace.groups.length} icon={BookOpen} /><StatCard title="Quizzes disponibles" value={workspace.quizzes.length} icon={ClipboardList} tone="cyan" /><StatCard title="Resources" value={workspace.resources.length} icon={FileText} tone="emerald" /><StatCard title="Progression" value={`${workspace.averageScore}%`} icon={TrendingUp} tone="amber" /></div><div className="grid gap-4 sm:grid-cols-2">{workspace.quizzes.filter((q) => !workspace.results.some((r) => r.quizId === q.id)).slice(0, 2).map((q) => <Link key={q.id} to={`/beneficiaire/quizzes/${q.id}`} className="rounded-2xl bg-indigo-600 p-5 font-bold text-white">Commencer : {q.title}</Link>)}</div><DataTable columns={[{ key: 'quizId', label: 'Quiz', render: (r) => workspace.quizzes.find((q) => q.id === r.quizId)?.title || 'Quiz' }, { key: 'groupId', label: 'Groupe', render: (r) => workspace.groups.find((g) => g.id === r.groupId)?.name || '' }, { key: 'score', label: 'Score', render: (r) => `${r.score}%` }, { key: 'date', label: 'Date', render: (r) => r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '' }]} rows={[...workspace.results].reverse()} /></div>;
}
