import { useEffect, useMemo, useState } from 'react';
import ResourceCard from '../../components/ResourceCard';
import { loadAdminResourcesWorkspace, openResource, RESOURCE_TYPES } from '../../services/resources';

export default function AdminResources() {
  const [workspace, setWorkspace] = useState({ resources: [], groups: [], intervenants: [] });
  const [filters, setFilters] = useState({ type: '', language: '', level: '', groupId: '', intervenantId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loadAdminResourcesWorkspace()
      .then((loaded) => {
        if (active) setWorkspace(loaded);
      })
      .catch((loadError) => {
        if (import.meta.env.DEV) console.error('Erreur chargement ressources admin', loadError);
        if (active) setError(loadError.message || 'Impossible de charger les ressources.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const languages = useMemo(() => [...new Set(workspace.groups.map((group) => group.language).filter(Boolean))], [workspace.groups]);
  const levels = useMemo(() => [...new Set(workspace.groups.map((group) => group.level).filter(Boolean))], [workspace.groups]);
  const rows = useMemo(() => workspace.resources.filter((resource) => (
    (!filters.type || resource.type === filters.type)
    && (!filters.language || resource.language === filters.language)
    && (!filters.level || resource.level === filters.level)
    && (!filters.groupId || resource.groupId === filters.groupId)
    && (!filters.intervenantId || resource.intervenantId === filters.intervenantId)
  )), [workspace.resources, filters]);

  const change = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

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

  return (
    <div className="space-y-5">
      {loading && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des ressources...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-5">
        <select value={filters.type} onChange={change('type')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous types</option>{RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
        <select value={filters.language} onChange={change('language')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Toutes langues</option>{languages.map((language) => <option key={language}>{language}</option>)}</select>
        <select value={filters.level} onChange={change('level')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous niveaux</option>{levels.map((level) => <option key={level}>{level}</option>)}</select>
        <select value={filters.groupId} onChange={change('groupId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous groupes</option>{workspace.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
        <select value={filters.intervenantId} onChange={change('intervenantId')} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Tous intervenants</option>{workspace.intervenants.map((intervenant) => <option key={intervenant.id} value={intervenant.id}>{intervenant.name}</option>)}</select>
      </div>
      {!loading && !rows.length && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">Aucune ressource ne correspond aux filtres sélectionnés.</div>}
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((resource) => <ResourceCard key={resource.id} resource={resource} groupName={resource.groupName} intervenantName={resource.intervenantName} onOpen={() => handleOpen(resource)} onPreview={() => handleOpen(resource)} opening={openingId === resource.id} />)}
      </div>
    </div>
  );
}
