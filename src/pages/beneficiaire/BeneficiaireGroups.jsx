import { useEffect, useState } from 'react';
import { useAppData } from '../../App';
import { loadBeneficiaryWorkspace } from '../../services/beneficiary';

export default function BeneficiaireGroups({ user }) {
  const { data } = useAppData();
  const [workspace, setWorkspace] = useState({ groups: [], quizzes: [], resources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadBeneficiaryWorkspace(user, data)
      .then((loaded) => active && setWorkspace(loaded))
      .catch((loadError) => active && setError(loadError.message || 'Impossible de charger vos groupes.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, data]);

  if (loading) return <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des groupes...</div>;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>;
  return <div className="grid gap-4 lg:grid-cols-2">{workspace.groups.map((g) => <article key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="font-black text-slate-900">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{g.language} · {g.level} · {g.intervenantName}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><Info label="Resources" value={workspace.resources.filter((r) => r.groupId === g.id).length} /><Info label="Quizzes" value={workspace.quizzes.filter((q) => q.groupId === g.id).length} /></div></article>)}</div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}
