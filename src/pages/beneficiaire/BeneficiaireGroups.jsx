import { useAppData } from '../../App';

export default function BeneficiaireGroups({ user }) {
  const { data } = useAppData();
  const beneficiary = data.beneficiaries.find((b) => b.id === user.id);
  const groups = data.groups.filter((g) => beneficiary?.groupIds.includes(g.id));
  return <div className="grid gap-4 lg:grid-cols-2">{groups.map((g) => <article key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-black text-slate-900">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{g.language} · {g.level} · {data.intervenants.find((i) => i.id === g.intervenantId)?.name}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><Info label="Resources" value={data.resources.filter((r) => r.groupId === g.id).length} /><Info label="Quizzes" value={data.quizzes.filter((q) => q.groupId === g.id && q.status === 'publié').length} /></div></article>)}</div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}
