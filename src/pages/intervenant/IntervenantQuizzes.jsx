import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../App';
import { fetchQuizzesForIntervenant } from '../../services/quizzes';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

export default function IntervenantQuizzes({ user }) {
  const { data } = useAppData();
  const [remoteQuizzes, setRemoteQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchQuizzesForIntervenant(user)
      .then((quizzes) => {
        if (active) setRemoteQuizzes(quizzes);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement quizzes intervenant', loadError);
        if (active) setError(loadError.message || 'Impossible de charger vos quizzes.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [user]);

  const rows = useMemo(() => {
    const ownerIds = new Set([user?.id, user?.authUserId, user?.profileId].filter(Boolean));
    const localRows = data.quizzes.filter((q) => ownerIds.has(q.createdBy || q.created_by));
    const byQuizId = new Map();
    [...remoteQuizzes, ...localRows].forEach((quiz) => {
      if (quiz?.id && !byQuizId.has(quiz.id)) byQuizId.set(quiz.id, quiz);
    });
    return [...byQuizId.values()];
  }, [data.quizzes, remoteQuizzes, user]);

  const columns = [
    { key: 'title', label: 'Quiz' },
    { key: 'groupId', label: 'Groupe', render: (r) => r.groupName || data.groups.find((g) => g.id === r.groupId)?.name || 'Groupe' },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'questions', label: 'Questions', render: (r) => r.questions?.length || 0 },
    { key: 'avg', label: 'Score moyen', render: (r) => `${avg(data.quizResults.filter((x) => x.quizId === r.id).map((x) => x.score))}%` },
    { key: 'actions', label: 'Actions', render: () => <Link to="/intervenant/resultats" className="font-bold text-indigo-600">Voir résultats</Link> },
  ];
  return (
    <div className="space-y-4">
      {loading && <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des quizzes...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}

function avg(values) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}
