import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import ResourceCard from '../../components/ResourceCard';
import { createResource, deleteResource, loadIntervenantResourceWorkspace, openResource, RESOURCE_TYPES } from '../../services/resources';

const initialForm = {
  title: '',
  type: 'PDF',
  groupId: '',
  url: '',
  description: '',
  file: null,
};

export default function IntervenantResources({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileMode = form.type !== 'Video link';
  const selectedGroup = useMemo(() => groups.find((group) => group.id === form.groupId), [form.groupId, groups]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loadIntervenantResourceWorkspace(user)
      .then(({ groups: loadedGroups, resources: loadedResources }) => {
        if (!active) return;
        setGroups(loadedGroups);
        setResources(loadedResources);
        setForm((current) => ({ ...current, groupId: current.groupId || loadedGroups[0]?.id || '' }));
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement ressources', loadError);
        if (active) setError(loadError.message || 'Impossible de charger les ressources.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const created = await createResource({ user, groups, values: form });
      setResources((current) => [created, ...current]);
      setForm({ ...initialForm, groupId: groups[0]?.id || '' });
      event.currentTarget.reset();
      setSuccess('Ressource enregistrée avec succès.');
      setShowForm(false);
    } catch (saveError) {
      if (import.meta.env.DEV) console.error('Erreur création ressource', saveError);
      setError(saveError.message || 'Impossible d’enregistrer la ressource.');
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(resource) {
    setError('');
    try {
      setOpeningId(resource.id);
      await openResource(resource);
    } catch (openError) {
      setError(openError.message || 'Impossible d’ouvrir la ressource.');
    } finally {
      setOpeningId('');
    }
  }

  async function handleDelete(resource) {
    setError('');
    setSuccess('');
    try {
      await deleteResource(resource);
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setSuccess('Ressource supprimée.');
    } catch (deleteError) {
      setError(deleteError.message || 'Impossible de supprimer la ressource.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white">
          <Plus size={18} /> Ajouter ressource
        </button>
      </div>

      {loading && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des ressources...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div>}

      {showForm && (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-2">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Titre" className="rounded-xl border border-slate-200 px-4 py-3" />
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, file: null, url: '' })} className="rounded-xl border border-slate-200 px-4 py-3">
            {RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })} required disabled={loading || !groups.length} className="rounded-xl border border-slate-200 px-4 py-3 disabled:bg-slate-50">
            {groups.length ? groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>) : <option value="">Aucun groupe assigné</option>}
          </select>
          {fileMode ? (
            <input key={form.type} type="file" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} className="rounded-xl border border-slate-200 px-4 py-3" />
          ) : (
            <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} type="url" required placeholder="Lien vidéo" className="rounded-xl border border-slate-200 px-4 py-3" />
          )}
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" />
          {selectedGroup && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:col-span-2">{selectedGroup.language} · {selectedGroup.level}</p>}
          {!groups.length && !loading && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 md:col-span-2">Aucun groupe ne vous est encore assigné. Contactez l’administrateur.</p>}
          {saving && <p className="rounded-xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 md:col-span-2">Téléversement en cours...</p>}
          <button disabled={saving || loading || !groups.length} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2">
            {saving ? 'Enregistrement...' : 'Enregistrer la ressource'}
          </button>
        </form>
      )}

      {!loading && !resources.length && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">Aucune ressource ajoutée pour le moment.</div>}
      <div className="grid gap-4 xl:grid-cols-2">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            groupName={resource.groupName}
            onOpen={() => handleOpen(resource)}
            onPreview={() => handleOpen(resource)}
            onDelete={() => handleDelete(resource)}
            opening={openingId === resource.id}
            canDelete
          />
        ))}
      </div>
    </div>
  );
}
