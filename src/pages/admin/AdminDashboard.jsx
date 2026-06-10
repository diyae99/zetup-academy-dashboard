import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, ClipboardList, FileText, GraduationCap, Target, UsersRound } from 'lucide-react';
import { useAppData } from '../../App';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import DataTable from '../../components/DataTable';

export default function AdminDashboard() {
  const { data } = useAppData();
  const { intervenants, beneficiaries, groups, quizzes, resources, quizResults } = data;
  const avg = Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length);
  const byIntervenant = intervenants.map((i) => ({
    name: i.name.split(' ')[0],
    quizzes: quizzes.filter((q) => q.createdBy === i.id).length,
    resources: resources.filter((r) => r.intervenantId === i.id).length,
  }));
  const byLang = ['Français', 'Anglais'].map((name) => ({ name, value: groups.filter((g) => g.language === name).length }));
  const topGroups = [...groups].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);
  const columns = [
    { key: 'name', label: 'Groupe' },
    { key: 'language', label: 'Langue' },
    { key: 'level', label: 'Niveau' },
    { key: 'averageScore', label: 'Score moyen', render: (row) => `${row.averageScore}%` },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total bénéficiaires" value={beneficiaries.length} icon={UsersRound} tone="cyan" />
        <StatCard title="Intervenants" value={intervenants.length} icon={GraduationCap} />
        <StatCard title="Groupes" value={groups.length} icon={BookOpen} tone="emerald" />
        <StatCard title="Quizzes" value={quizzes.length} icon={ClipboardList} tone="amber" />
        <StatCard title="Resources" value={resources.length} icon={FileText} tone="rose" />
      </div>
      <StatCard title="Moyenne des scores" value={`${avg}%`} icon={Target} hint="Calculée sur les résultats enregistrés" tone="emerald" />
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Quizzes par intervenant"><ResponsiveContainer><BarChart data={byIntervenant}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="quizzes" fill="#4F46E5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Resources par intervenant"><ResponsiveContainer><BarChart data={byIntervenant}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="resources" fill="#06B6D4" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Groupes par langue"><ResponsiveContainer><PieChart><Pie data={byLang} dataKey="value" nameKey="name" outerRadius={92} label>{byLang.map((_, index) => <Cell key={index} fill={index ? '#06B6D4' : '#4F46E5'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <DataTable columns={columns} rows={topGroups} />
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="font-bold text-slate-900">Dernières activités</h3>
          <div className="mt-4 space-y-4">
            {quizResults.slice(-5).reverse().map((result) => {
              const ben = beneficiaries.find((b) => b.id === result.beneficiaryId);
              const quiz = quizzes.find((q) => q.id === result.quizId);
              return <div key={result.id} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{ben?.name}</b> a terminé <b>{quiz?.title}</b> avec {result.score}%</div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
