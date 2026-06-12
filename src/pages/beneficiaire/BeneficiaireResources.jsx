import { useEffect, useState } from 'react';
import { useAppData } from '../../App';
import ResourceCard from '../../components/ResourceCard';
import ResourcePreviewModal from '../../components/ResourcePreviewModal';
import { loadBeneficiaryWorkspace } from '../../services/beneficiary';
import { openResource, resolveResourceUrl } from '../../services/resources';

export default function BeneficiaireResources({ user }) {
  const { data } = useAppData();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadBeneficiaryWorkspace(user, data)
      .then((loaded) => active && setResources(loaded.resources))
      .catch((loadError) => active && setError(loadError.message || 'Impossible de charger les ressources.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, data]);

  async function handleOpen(resource) {
    setError('');
    try {
      setOpeningId(resource.id);
      await openResource(resource);
    } catch (openError) {
      setError(openError.message || 'Fichier indisponible ou lien invalide');
    } finally {
      setOpeningId('');
    }
  }

  async function handlePreview(resource) {
    setError('');
    try {
      setOpeningId(resource.id);
      const url = await resolveResourceUrl(resource);
      setPreview({ resource, url });
    } catch (previewError) {
      setError(previewError.message || 'Fichier indisponible ou lien invalide');
    } finally {
      setOpeningId('');
    }
  }

  if (loading) return <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des ressources...</div>;
  return <div className="space-y-5">{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}<div className="grid gap-4 xl:grid-cols-2">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} groupName={resource.groupName} onOpen={() => handleOpen(resource)} onPreview={() => handlePreview(resource)} opening={openingId === resource.id} />)}</div>{!resources.length && <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">Aucune ressource disponible.</div>}{preview && <ResourcePreviewModal resource={preview.resource} url={preview.url} onClose={() => setPreview(null)} />}</div>;
}
