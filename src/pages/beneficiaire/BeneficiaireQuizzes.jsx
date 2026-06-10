import { useAppData } from '../../App';
import QuizCard from '../../components/QuizCard';

export default function BeneficiaireQuizzes({ user }) {
  const { data } = useAppData();
  const beneficiary = data.beneficiaries.find((b) => b.id === user.id);
  const groupIds = beneficiary?.groupIds || [];
  const quizzes = data.quizzes.filter((q) => groupIds.includes(q.groupId) && q.status === 'publié');
  return <div className="grid gap-4 xl:grid-cols-2">{quizzes.map((q) => <QuizCard key={q.id} quiz={q} groupName={data.groups.find((g) => g.id === q.groupId)?.name} result={data.quizResults.find((r) => r.quizId === q.id && r.beneficiaryId === user.id)} startPath={`/beneficiaire/quizzes/${q.id}`} />)}</div>;
}
