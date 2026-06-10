import { useMemo, useState } from 'react';
import { useAppData } from '../../App';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

export default function IntervenantResults({ user }) {
  const { data } = useAppData();
  const myQuizzes = data.quizzes.filter((q) => q.createdBy === user.id);
  const myGroups = data.groups.filter((g) => g.intervenantId === user.id);
  const [groupId, setGroupId] = useState('');
  const [quizId, setQuizId] = useState('');
  const rows = useMemo(() => data.quizResults.filter((r) => myQuizzes.some((q) => q.id === r.quizId) && (!groupId || r.groupId === groupId) && (!quizId || r.quizId === quizId)), [data.quizResults, myQuizzes, groupId, quizId]);
  const columns = [
    { key: 'beneficiaryId', label: 'Bénéficiaire', render: (r) => data.beneficiaries.find((b) => b.id === r.beneficiaryId)?.name },
    { key: 'groupId', label: 'Groupe', render: (r) => data.groups.find((g) => g.id === r.groupId)?.name },
    { key: 'quizId', label: 'Quiz', render: (r) => data.quizzes.find((q) => q.id === r.quizId)?.title },
    { key: 'score', label: 'Score', render: (r) => `${r.score}%` },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.score >= 50 ? 'réussi' : 'à améliorer'}</Badge> },
  ];
  return <div className="space-y-5"><div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:grid-cols-2"><select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous groupes</option>{myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><select value={quizId} onChange={(e) => setQuizId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous quizzes</option>{myQuizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}</select></div><DataTable columns={columns} rows={rows} /></div>;
}
