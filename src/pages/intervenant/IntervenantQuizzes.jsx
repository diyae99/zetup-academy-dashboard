import { Link } from 'react-router-dom';
import { useAppData } from '../../App';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

export default function IntervenantQuizzes({ user }) {
  const { data } = useAppData();
  const rows = data.quizzes.filter((q) => q.createdBy === user.id);
  const columns = [
    { key: 'title', label: 'Quiz' },
    { key: 'groupId', label: 'Groupe', render: (r) => data.groups.find((g) => g.id === r.groupId)?.name },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'questions', label: 'Questions', render: (r) => r.questions.length },
    { key: 'avg', label: 'Score moyen', render: (r) => `${avg(data.quizResults.filter((x) => x.quizId === r.id).map((x) => x.score))}%` },
    { key: 'actions', label: 'Actions', render: () => <Link to="/intervenant/resultats" className="font-bold text-indigo-600">Voir résultats</Link> },
  ];
  return <DataTable columns={columns} rows={rows} />;
}

function avg(values) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}
