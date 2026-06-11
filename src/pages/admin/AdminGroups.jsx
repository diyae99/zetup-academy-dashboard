import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '../../App';
import { createAssignedGroup, fetchAdminGroupFormData } from '../../services/groupAssignments';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';

export default function AdminGroups() {
  const { data, setData } = useAppData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ intervenants: [], languages: [], levels: [] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAdminGroupFormData()
      .then((loaded) => {
        if (active) setFormData(loaded);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement données groupes admin', loadError);
        if (active) setError(loadError.message || 'Impossible de charger les données de création du groupe.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function add(event) {
    event.preventDefault();
    setError('');
    const f = new FormData(event.currentTarget);
    const language = formData.languages.find((item) => item.id === f.get('languageId'));
    const level = formData.levels.find((item) => item.id === f.get('levelId'));

    try {
      setSaving(true);
      const created = await createAssignedGroup({
        name: f.get('name'),
        languageId: f.get('languageId'),
        levelId: f.get('levelId'),
        intervenantId: f.get('intervenantId'),
        status: 'actif',
      });

      setData((d) => ({
        ...d,
        groups: [
          ...d.groups,
          {
            id: created.id,
            name: created.name,
            language: language?.name || '',
            level: level?.name || '',
            intervenantId: created.intervenant_id,
            beneficiaryIds: f.getAll('beneficiaries'),
            averageScore: 0,
            status: created.status || 'actif',
          },
        ],
      }));
      setOpen(false);
    } catch (creationError) {
      setError(creationError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-5">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="flex justify-end"><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white"><Plus size={18} /> Ajouter un groupe</button></div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {data.groups.map((g) => {
          const int = data.intervenants.find((i) => i.id === g.intervenantId);
          return <article key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{g.name}</h3><p className="mt-1 text-sm text-slate-500">{g.language} · {g.level} · {int?.name}</p></div><Badge>{g.status}</Badge></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Info label="Bénéficiaires" value={g.beneficiaryIds.length} />
              <Info label="Quizzes" value={data.quizzes.filter((q) => q.groupId === g.id).length} />
              <Info label="Resources" value={data.resources.filter((r) => r.groupId === g.id).length} />
              <Info label="Score moyen" value={`${g.averageScore}%`} />
            </div>
          </article>;
        })}
      </div>
      {open && <Modal title="Ajouter un groupe" onClose={() => setOpen(false)}><GroupForm onSubmit={add} data={data} formData={formData} saving={saving} error={error} /></Modal>}
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black text-slate-900">{value}</p></div>;
}

function GroupForm({ onSubmit, data, formData, saving, error }) {
  const languageOptions = formData.languages;
  const levelOptions = formData.levels;
  const intervenantOptions = formData.intervenants;
  const formReady = languageOptions.length && levelOptions.length && intervenantOptions.length;

  return <form onSubmit={onSubmit} className="grid gap-4">
    <input name="name" required placeholder="Nom du groupe" className="rounded-xl border border-slate-200 px-4 py-3" />
    <div className="grid gap-4 sm:grid-cols-2"><select name="languageId" className="rounded-xl border border-slate-200 px-4 py-3">{languageOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select name="levelId" className="rounded-xl border border-slate-200 px-4 py-3">{levelOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
    <select name="intervenantId" required className="rounded-xl border border-slate-200 px-4 py-3">{intervenantOptions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
    <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">Bénéficiaires</legend>{data.beneficiaries.map((b) => <label key={b.id} className="mb-2 block text-sm"><input type="checkbox" name="beneficiaries" value={b.id} /> {b.name}</label>)}</fieldset>
    {!formReady && !error && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Chargement des données Supabase...</p>}
    {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
    <button disabled={saving || !formReady} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Création du groupe...' : 'Créer le groupe'}</button>
  </form>;
}
