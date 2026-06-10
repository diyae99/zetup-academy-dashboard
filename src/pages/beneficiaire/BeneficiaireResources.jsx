import { useAppData } from '../../App';
import ResourceCard from '../../components/ResourceCard';

export default function BeneficiaireResources({ user }) {
  const { data } = useAppData();
  const beneficiary = data.beneficiaries.find((b) => b.id === user.id);
  const groupIds = beneficiary?.groupIds || [];
  const rows = data.resources.filter((r) => groupIds.includes(r.groupId));
  return <div className="grid gap-4 xl:grid-cols-2">{rows.map((r) => <ResourceCard key={r.id} resource={r} groupName={data.groups.find((g) => g.id === r.groupId)?.name} intervenantName={data.intervenants.find((i) => i.id === r.intervenantId)?.name} />)}</div>;
}
