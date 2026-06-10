import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FilePlus2, FileText, Target, UsersRound } from 'lucide-react';
import { useAppData } from '../../App';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

export default function IntervenantDashboard({ user }) {
  const { data } = useAppData();
  const myGroups = data.groups.filter((g) => g.intervenantId === user.id);
  const myQuizzes = data.quizzes.filter((q) => q.createdBy === user.id);
  const myResources = data.resources.filter((r) => r.intervenantId === user.id);
  const results = data.quizResults.filter((r) => myQuizzes.some((q) => q.id === r.quizId));
  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><StatCard title="Mes groupes" value={myGroups.length} icon={BookOpen} /><StatCard title="Quizzes créés" value={myQuizzes.length} icon={ClipboardList} tone="cyan" /><StatCard title="Resources ajoutées" value={myResources.length} icon={FileText} tone="emerald" /><StatCard title="Score moyen" value={`${avg}%`} icon={Target} tone="amber" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><Link to="/intervenant/creer-quiz" className="flex items-center gap-3 rounded-2xl bg-indigo-600 p-5 font-bold text-white"><ClipboardList /> Créer quiz</Link><Link to="/intervenant/resources" className="flex items-center gap-3 rounded-2xl bg-cyan-600 p-5 font-bold text-white"><FilePlus2 /> Ajouter ressource</Link></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GroupList groups={myGroups} data={data} />
        <DataTable columns={[{ key: 'beneficiaryId', label: 'Bénéficiaire', render: (r) => data.beneficiaries.find((b) => b.id === r.beneficiaryId)?.name }, { key: 'quizId', label: 'Quiz', render: (r) => data.quizzes.find((q) => q.id === r.quizId)?.title }, { key: 'score', label: 'Score', render: (r) => `${r.score}%` }, { key: 'status', label: 'Statut', render: (r) => <Badge>{r.score >= 50 ? 'réussi' : 'à améliorer'}</Badge> }]} rows={results.slice(-6).reverse()} />
      </div>
    </div>
  );
}

function GroupList({ groups, data }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-bold text-slate-900">Mes groupes</h3><div className="mt-4 space-y-3">{groups.map((g) => <div key={g.id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{g.name}</p><p className="mt-1 text-sm text-slate-500"><UsersRound size={15} className="mr-1 inline" /> {g.beneficiaryIds.length} bénéficiaires · {data.quizzes.filter((q) => q.groupId === g.id).length} quizzes · {g.averageScore}% moyen</p></div>)}</div></div>;
}
