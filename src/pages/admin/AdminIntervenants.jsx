import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Eye, KeyRound, Plus, RefreshCcw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useAppData } from '../../App';
import { languages, levels } from '../../data/mockData';
import { createIntervenantAccount, deleteAccount, deleteAllAccounts, loadAdminAccounts, resetAccountPassword, setAccountStatus } from '../../services/adminUsers';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const body = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `Zetup-${body}`;
}

export default function AdminIntervenants() {
  const { data, setData } = useAppData();
  const [mockAccounts, setMockAccounts] = useState([]);
  const [remoteRows, setRemoteRows] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dangerAction, setDangerAction] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const sourceRows = remoteLoaded ? remoteRows : data.intervenants;
  const rows = useMemo(() => sourceRows.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.email.includes(search)), [sourceRows, search]);
  const counts = (row, key) => {
    const ids = new Set([row.id, row.profileId, row.authUserId].filter(Boolean));
    if (key === 'groups') return data.groups.filter((g) => ids.has(g.intervenantId)).length;
    return data[key].filter((x) => ids.has(x.createdBy || x.intervenantId)).length;
  };
  const accountFor = (row) => ({
    loginEmail: row.email,
    accountStatus: row.accountStatus || row.status || 'actif',
    lastLogin: row.lastLogin || 'Jamais',
    password: mockAccounts.find((user) => user.id === row.id)?.password,
  });

  async function refreshRows() {
    setLoading(true);
    try {
      setRemoteRows(await loadAdminAccounts('intervenant'));
      setRemoteLoaded(true);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les intervenants Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshRows();
  }, []);

  const showCredentials = (row, password) => {
    const account = accountFor(row);
    setConfirmation({
      title: 'Compte intervenant créé avec succès',
      email: account?.loginEmail || row.email,
      password: password || account?.password || 'Mot de passe non disponible',
    });
  };
  const resetPassword = async (row) => {
    const password = generatePassword();
    setError('');
    setBusyId(row.id);
    try {
      await resetAccountPassword({ role: 'intervenant', row, password });
      setMockAccounts((accounts) => [...accounts.filter((account) => account.id !== row.id), { id: row.id, loginEmail: row.email, password, accountStatus: row.accountStatus || 'actif', lastLogin: row.lastLogin || 'Jamais' }]);
      setConfirmation({ title: 'Mot de passe intervenant réinitialisé avec succès', email: row.email, password });
    } catch (resetError) {
      setError(resetError.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setBusyId('');
    }
  };
  const toggleStatus = async (row) => {
    const next = (row.accountStatus || row.status) === 'suspendu' ? 'actif' : 'suspendu';
    setError('');
    setBusyId(row.id);
    try {
      await setAccountStatus({ role: 'intervenant', row, accountStatus: next });
      setRemoteRows((current) => current.map((item) => (item.id === row.id ? { ...item, accountStatus: next, status: next } : item)));
      setSuccess(next === 'suspendu' ? 'Compte intervenant suspendu.' : 'Compte intervenant activé.');
    } catch (statusError) {
      setError(statusError.message || 'Impossible de modifier le statut du compte.');
    } finally {
      setBusyId('');
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setBusyId(deleteTarget.id);
    try {
      await deleteAccount({ role: 'intervenant', row: deleteTarget });
      setRemoteRows((current) => current.filter((item) => item.id !== deleteTarget.id));
      setData((current) => ({
        ...current,
        intervenants: current.intervenants.filter((item) => item.id !== deleteTarget.id && item.email !== deleteTarget.email),
        groups: current.groups.map((group) => (group.intervenantId === deleteTarget.id || group.intervenantId === deleteTarget.profileId ? { ...group, intervenantId: null } : group)),
      }));
      setDeleteTarget(null);
      setSuccess('Intervenant supprimé avec succès.');
    } catch (deleteError) {
      setError(deleteError.message || 'Impossible de supprimer cet intervenant.');
    } finally {
      setBusyId('');
    }
  };
  const confirmBulkDelete = async (confirmationWord) => {
    if (confirmationWord !== 'DELETE') {
      setError('Tapez DELETE pour confirmer.');
      return;
    }
    setError('');
    setBulkBusy(true);
    try {
      const result = await deleteAllAccounts({ role: 'intervenant', confirmation: confirmationWord });
      setRemoteRows([]);
      setData((current) => ({ ...current, intervenants: [], groups: current.groups.map((group) => ({ ...group, intervenantId: null })) }));
      setDangerAction(null);
      setSuccess(`${result.deleted ?? 0} intervenant(s) supprimé(s).`);
    } catch (bulkError) {
      setError(bulkError.message || 'Suppression globale impossible.');
    } finally {
      setBulkBusy(false);
    }
  };
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'languages', label: 'Langues', render: (r) => (r.languages || []).join(', ') || '-' },
    { key: 'groups', label: 'Groupes', render: (r) => counts(r, 'groups') },
    { key: 'quizzes', label: 'Quizzes', render: (r) => counts(r, 'quizzes') },
    { key: 'resources', label: 'Resources', render: (r) => counts(r, 'resources') },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'account', label: 'Compte', render: (r) => r.email || 'Non créé' },
    { key: 'accountStatus', label: 'Statut du compte', render: (r) => <Badge>{r.accountStatus || 'actif'}</Badge> },
    { key: 'lastLogin', label: 'Dernière connexion', render: (r) => r.lastLogin || 'Jamais' },
    { key: 'actions', label: 'Actions', render: (r) => <AccountActions row={r} account={accountFor(r)} busy={busyId === r.id} onShow={() => showCredentials(r)} onReset={() => resetPassword(r)} onToggle={() => toggleStatus(r)} onDelete={() => setDeleteTarget(r)} /> },
  ];
  async function add(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const profileEmail = form.get('email');
    const loginEmail = form.get('loginEmail');
    const password = form.get('password');
    const payload = {
      fullName: form.get('name'),
      email: loginEmail,
      password,
      phone: form.get('phone'),
      languages: form.getAll('languages'),
      levels: form.getAll('levels'),
      accountStatus: form.get('accountStatus'),
    };

    try {
      setSaving(true);
      const result = await createIntervenantAccount(payload);
      const id = result.profile?.id || result.authUserId;
      setData((d) => ({
        ...d,
        intervenants: [
          ...d.intervenants,
          {
            id,
            authUserId: result.authUserId,
            name: form.get('name'),
            email: profileEmail || loginEmail,
            phone: form.get('phone'),
            languages: form.getAll('languages'),
            levels: form.getAll('levels'),
            status: form.get('status'),
          },
        ],
      }));
      setMockAccounts((accounts) => [...accounts, { id, loginEmail, password, accountStatus: form.get('accountStatus'), lastLogin: 'Jamais' }]);
      setConfirmation({ title: result.message || 'Compte intervenant créé avec succès', email: loginEmail, password, warning: result.warning });
      await refreshRows();
      setOpen(false);
    } catch (creationError) {
      setError(creationError.message);
    } finally {
      setSaving(false);
    }
  }
  const copyCredentials = () => navigator.clipboard?.writeText(`Email de connexion: ${confirmation.email}\nMot de passe temporaire: ${confirmation.password}`);
  return (
    <div className="space-y-5">
      {confirmation && <ConfirmationCard confirmation={confirmation} onCopy={copyCredentials} />}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-md items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><Search size={18} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un intervenant" className="w-full outline-none" /></label>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700"><Plus size={18} /> Ajouter un intervenant</button>
      </div>
      {loading && <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70">Chargement des comptes intervenants...</div>}
      <DataTable columns={columns} rows={rows} />
      <DangerZone onDeleteAll={() => setDangerAction('intervenants')} busy={bulkBusy} />
      {open && <Modal title="Ajouter un intervenant" onClose={() => setOpen(false)}><AdminPersonForm onSubmit={add} languageOptions={languages} levelOptions={levels} saving={saving} formError={error} /></Modal>}
      {deleteTarget && <ConfirmDeleteModal title="Supprimer intervenant" message="Voulez-vous vraiment supprimer cet intervenant ? Cette action supprimera son compte et désassignera ses groupes. Ses ressources et quizzes associés seront supprimés." busy={busyId === deleteTarget.id} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
      {dangerAction && <DangerConfirmModal title="Supprimer tous les intervenants" busy={bulkBusy} onCancel={() => setDangerAction(null)} onConfirm={confirmBulkDelete} />}
    </div>
  );
}

function AdminPersonForm({ onSubmit, languageOptions, levelOptions, saving, formError }) {
  const [password, setPassword] = useState(generatePassword());
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input name="name" required placeholder="Nom complet" className="rounded-xl border border-slate-200 px-4 py-3" />
      <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3" />
      <input name="phone" placeholder="Téléphone" className="rounded-xl border border-slate-200 px-4 py-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">Langues</legend>{languageOptions.map((x) => <label key={x} className="mr-4 text-sm"><input type="checkbox" name="languages" value={x} defaultChecked /> {x}</label>)}</fieldset>
        <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">Niveaux</legend>{levelOptions.map((x) => <label key={x} className="mr-4 text-sm"><input type="checkbox" name="levels" value={x} defaultChecked={x === 'A1'} /> {x}</label>)}</fieldset>
      </div>
      <select name="status" className="rounded-xl border border-slate-200 px-4 py-3"><option>actif</option><option>archivé</option></select>
      <AccountSection role="intervenant" password={password} setPassword={setPassword} />
      {formError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{formError}</p>}
      <button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Création du compte...' : 'Enregistrer'}</button>
    </form>
  );
}

function AccountSection({ password, setPassword }) {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 text-indigo-600"><ShieldCheck size={20} /></div>
        <div>
          <h3 className="font-black text-slate-900">Compte utilisateur</h3>
          <p className="mt-1 text-sm text-slate-600">Ces identifiants permettront à l’utilisateur d’accéder à son espace personnel.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input name="loginEmail" required type="email" placeholder="Email de connexion" className="rounded-xl border border-slate-200 bg-white px-4 py-3" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input name="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe temporaire" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3" />
          <button type="button" onClick={() => setPassword(generatePassword())} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-3 text-sm font-bold text-indigo-700"><KeyRound size={18} /> Générer un mot de passe</button>
        </div>
        <select name="accountStatus" className="rounded-xl border border-slate-200 bg-white px-4 py-3"><option>actif</option><option>suspendu</option></select>
        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">Rôle automatique : intervenant</div>
      </div>
    </section>
  );
}

function AccountActions({ account, busy, onShow, onReset, onToggle, onDelete }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onShow} disabled={!account || busy} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40"><Eye size={14} /> Voir identifiants</button>
      <button onClick={onReset} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-indigo-700 disabled:opacity-40"><RefreshCcw size={14} /> Réinitialiser mot de passe</button>
      <button onClick={onToggle} disabled={!account || busy} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-amber-700 disabled:opacity-40">{account?.accountStatus === 'suspendu' ? 'Activer' : 'Suspendre'} le compte</button>
      <button onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 disabled:opacity-40"><Trash2 size={14} /> Supprimer compte</button>
    </div>
  );
}

function ConfirmationCard({ confirmation, onCopy }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h3 className="font-black text-emerald-900">{confirmation.title}</h3>
      <div className="mt-3 grid gap-2 text-sm text-emerald-900 sm:grid-cols-2">
        <p><b>Email de connexion :</b> {confirmation.email}</p>
        <p><b>Mot de passe temporaire :</b> {confirmation.password}</p>
      </div>
      {confirmation.warning && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{confirmation.warning}</p>}
      <button onClick={onCopy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Copy size={16} /> Copier les identifiants</button>
    </div>
  );
}

function DangerZone({ onDeleteAll, busy }) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-rose-600" />
        <div className="flex-1">
          <h3 className="font-black text-rose-950">Zone dangereuse</h3>
          <p className="mt-1 text-sm text-rose-800">Actions irréversibles réservées aux administrateurs.</p>
          <button disabled={busy} onClick={onDeleteAll} className="mt-4 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Supprimer tous les intervenants</button>
        </div>
      </div>
    </section>
  );
}

function ConfirmDeleteModal({ title, message, busy, onCancel, onConfirm }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        <div className="flex justify-end gap-3">
          <button disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 disabled:opacity-50">Annuler</button>
          <button disabled={busy} onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Suppression...' : 'Supprimer'}</button>
        </div>
      </div>
    </Modal>
  );
}

function DangerConfirmModal({ title, busy, onCancel, onConfirm }) {
  const [word, setWord] = useState('');
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm font-semibold text-rose-700">Tapez DELETE pour confirmer cette suppression définitive.</p>
        <input value={word} onChange={(event) => setWord(event.target.value)} placeholder="DELETE" className="w-full rounded-xl border border-rose-200 px-4 py-3" />
        <div className="flex justify-end gap-3">
          <button disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 disabled:opacity-50">Annuler</button>
          <button disabled={busy || word !== 'DELETE'} onClick={() => onConfirm(word)} className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Suppression...' : 'Confirmer'}</button>
        </div>
      </div>
    </Modal>
  );
}
