import { useEffect, useState } from 'react';
import { useAppData } from '../../App';
import QuizCard from '../../components/QuizCard';
import { loadBeneficiaryWorkspace } from '../../services/beneficiary';

export default function BeneficiaireQuizzes({ user }) {
  const { data } = useAppData();
  const [workspace, setWorkspace] = useState({ quizzes: [], groups: [], results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadBeneficiaryWorkspace(user, data)
      .then((loaded) => active && setWorkspace(loaded))
      .catch((loadError) => active && setError(loadError.message || 'Impossible de charger les quizzes.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, data]);

  if (loading) return <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des quizzes...</div>;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>;
  return <div className="grid gap-4 xl:grid-cols-2">{workspace.quizzes.map((q) => <QuizCard key={q.id} quiz={q} groupName={workspace.groups.find((g) => g.id === q.groupId)?.name} result={workspace.results.find((r) => r.quizId === q.id)} startPath={`/beneficiaire/quizzes/${q.id}`} />)}</div>;
}
