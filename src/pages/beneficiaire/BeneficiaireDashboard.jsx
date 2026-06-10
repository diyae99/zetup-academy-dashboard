import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FileText, TrendingUp } from 'lucide-react';
import { useAppData } from '../../App';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';

export default function BeneficiaireDashboard({ user }) {
  const { data } = useAppData();
  const beneficiary = data.beneficiaries.find((b) => b.id === user.id);
  const myGroups = data.groups.filter((g) => beneficiary?.groupIds.includes(g.id));
  const groupIds = myGroups.map((g) => g.id);
  const myQuizzes = data.quizzes.filter((q) => groupIds.includes(q.groupId) && q.status === 'publié');
  const myResources = data.resources.filter((r) => groupIds.includes(r.groupId));
  const myResults = data.quizResults.filter((r) => r.beneficiaryId === user.id);
  const avg = myResults.length ? Math.round(myResults.reduce((s, r) => s + r.score, 0) / myResults.length) : 0;
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-4"><StatCard title="Mes groupes" value={myGroups.length} icon={BookOpen} /><StatCard title="Quizzes disponibles" value={myQuizzes.length} icon={ClipboardList} tone="cyan" /><StatCard title="Resources" value={myResources.length} icon={FileText} tone="emerald" /><StatCard title="Progression" value={`${avg}%`} icon={TrendingUp} tone="amber" /></div><div className="grid gap-4 sm:grid-cols-2">{myQuizzes.filter((q) => !myResults.some((r) => r.quizId === q.id)).slice(0, 2).map((q) => <Link key={q.id} to={`/beneficiaire/quizzes/${q.id}`} className="rounded-2xl bg-indigo-600 p-5 font-bold text-white">Commencer : {q.title}</Link>)}</div><DataTable columns={[{ key: 'quizId', label: 'Quiz', render: (r) => data.quizzes.find((q) => q.id === r.quizId)?.title }, { key: 'groupId', label: 'Groupe', render: (r) => data.groups.find((g) => g.id === r.groupId)?.name }, { key: 'score', label: 'Score', render: (r) => `${r.score}%` }, { key: 'date', label: 'Date' }]} rows={[...myResults].reverse()} /></div>;
}
