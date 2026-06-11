import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, ClipboardList, FileText, GraduationCap, Target, UsersRound } from 'lucide-react';
import { fetchAdminDashboard } from '../../services/dashboards';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import DataTable from '../../components/DataTable';

const emptyDashboard = {
  stats: { beneficiaries: 0, intervenants: 0, groups: 0, quizzes: 0, resources: 0, averageScore: 0 },
  byIntervenant: [],
  byLanguage: [],
  topGroups: [],
  activities: [],
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchAdminDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur dashboard admin', loadError);
        if (active) setError(loadError.message || 'Impossible de charger le tableau de bord admin.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const { stats, byIntervenant, byLanguage, topGroups, activities } = dashboard;
  const columns = [
    { key: 'name', label: 'Groupe' },
    { key: 'language', label: 'Langue' },
    { key: 'level', label: 'Niveau' },
    { key: 'averageScore', label: 'Score moyen', render: (row) => `${row.averageScore}%` },
  ];

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement du tableau de bord...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total bénéficiaires" value={stats.beneficiaries} icon={UsersRound} tone="cyan" />
        <StatCard title="Intervenants" value={stats.intervenants} icon={GraduationCap} />
        <StatCard title="Groupes" value={stats.groups} icon={BookOpen} tone="emerald" />
        <StatCard title="Quizzes" value={stats.quizzes} icon={ClipboardList} tone="amber" />
        <StatCard title="Resources" value={stats.resources} icon={FileText} tone="rose" />
      </div>
      <StatCard title="Moyenne des scores" value={`${stats.averageScore}%`} icon={Target} hint="Calculée sur les résultats enregistrés" tone="emerald" />
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Quizzes par intervenant"><ResponsiveContainer><BarChart data={byIntervenant}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="quizzes" fill="#4F46E5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Resources par intervenant"><ResponsiveContainer><BarChart data={byIntervenant}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="resources" fill="#06B6D4" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Groupes par langue"><ResponsiveContainer><PieChart><Pie data={byLanguage} dataKey="value" nameKey="name" outerRadius={92} label>{byLanguage.map((_, index) => <Cell key={index} fill={index ? '#06B6D4' : '#4F46E5'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <DataTable columns={columns} rows={topGroups} />
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="font-bold text-slate-900">Dernières activités</h3>
          <div className="mt-4 space-y-4">
            {activities.length ? activities.map((activity) => <div key={activity.id} className="rounded-xl bg-slate-50 p-3 text-sm">{activity.label}</div>) : <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Aucune activité récente.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
