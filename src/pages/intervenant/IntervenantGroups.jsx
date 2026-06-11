import { useEffect, useState } from 'react';
import { useAppData } from '../../App';
import { fetchAssignedGroupsForIntervenant } from '../../services/groupAssignments';

export default function IntervenantGroups({ user }) {
  const { data } = useAppData();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchAssignedGroupsForIntervenant(user)
      .then(({ groups: assignedGroups }) => {
        if (active) setGroups(assignedGroups);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement groupes intervenant', loadError);
        if (active) setError(loadError.message || 'Impossible de charger vos groupes assignés.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement de vos groupes...</div>;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>;
  if (!groups.length) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">Aucun groupe ne vous est encore assigné. Contactez l’administrateur.</div>;

  return <div className="grid gap-5 xl:grid-cols-2">{groups.map((g) => <section key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h3 className="text-lg font-black">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{g.language} · {g.level} · Score moyen {g.averageScore}%</p><Block title="Bénéficiaires" items={g.beneficiaryIds.map((id) => data.beneficiaries.find((b) => b.id === id)?.name)} /><Block title="Quizzes" items={data.quizzes.filter((q) => q.groupId === g.id).map((q) => q.title)} /><Block title="Resources" items={data.resources.filter((r) => r.groupId === g.id).map((r) => r.title)} /></section>)}</div>;
}

function Block({ title, items }) {
  return <div className="mt-5"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h4><div className="mt-2 flex flex-wrap gap-2">{items.filter(Boolean).map((x) => <span key={x} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{x}</span>)}</div></div>;
}
