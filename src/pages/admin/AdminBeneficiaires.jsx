import { useMemo, useState } from 'react';
import { Copy, Eye, KeyRound, Plus, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import { useAppData } from '../../App';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const body = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `Zetup-${body}`;
}

export default function AdminBeneficiaires() {
  const { data, setData } = useAppData();
  const [mockAccounts, setMockAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const rows = useMemo(() => data.beneficiaries.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.email.includes(search)), [data.beneficiaries, search]);
  const accountFor = (id) => mockAccounts.find((user) => user.id === id);
  const showCredentials = (row, password) => {
    const account = accountFor(row.id);
    setConfirmation({
      title: 'Compte bénéficiaire créé avec succès',
      email: account?.loginEmail || row.email,
      password: password || account?.password || 'Mot de passe non disponible',
    });
  };
  const resetPassword = (row) => {
    const password = generatePassword();
    setMockAccounts((accounts) => accounts.map((account) => (account.id === row.id ? { ...account, password } : account)));
    showCredentials(row, password);
  };
  const toggleStatus = (row) => {
    const account = accountFor(row.id);
    if (!account) return;
    setMockAccounts((accounts) => accounts.map((item) => (item.id === row.id ? { ...item, accountStatus: item.accountStatus === 'suspendu' ? 'actif' : 'suspendu' } : item)));
  };
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'groups', label: 'Groupes', render: (r) => r.groupIds.map((id) => data.groups.find((g) => g.id === id)?.name).filter(Boolean).join(', ') },
    { key: 'lastScore', label: 'Dernier score', render: (r) => `${[...data.quizResults].reverse().find((x) => x.beneficiaryId === r.id)?.score ?? 0}%` },
    { key: 'status', label: 'Statut', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'account', label: 'Compte', render: (r) => accountFor(r.id)?.loginEmail || 'Non créé' },
    { key: 'accountStatus', label: 'Statut du compte', render: (r) => accountFor(r.id) ? <Badge>{accountFor(r.id).accountStatus}</Badge> : <Badge>Non créé</Badge> },
    { key: 'lastLogin', label: 'Dernière connexion', render: (r) => accountFor(r.id)?.lastLogin || 'Jamais' },
    { key: 'actions', label: 'Actions', render: (r) => <AccountActions account={accountFor(r.id)} onShow={() => showCredentials(r)} onReset={() => resetPassword(r)} onToggle={() => toggleStatus(r)} /> },
  ];
  function add(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = `ben-${Date.now()}`;
    const profileEmail = form.get('email');
    const loginEmail = form.get('loginEmail');
    const password = form.get('password');
    const groupIds = form.getAll('groups');
    setData((d) => ({
      ...d,
      beneficiaries: [...d.beneficiaries, { id, name: form.get('name'), email: profileEmail, phone: form.get('phone'), groupIds, status: form.get('status') }],
      groups: d.groups.map((group) => (groupIds.includes(group.id) ? { ...group, beneficiaryIds: [...new Set([...group.beneficiaryIds, id])] } : group)),
    }));
    setMockAccounts((accounts) => [...accounts, { id, loginEmail, password, accountStatus: form.get('accountStatus'), lastLogin: 'À configurer via Edge Function' }]);
    setConfirmation({ title: 'Profil bénéficiaire enregistré', email: loginEmail, password });
    setOpen(false);
  }
  const copyCredentials = () => navigator.clipboard?.writeText(`Email de connexion: ${confirmation.email}\nMot de passe temporaire: ${confirmation.password}`);
  return (
    <div className="space-y-5">
      {confirmation && <ConfirmationCard confirmation={confirmation} onCopy={copyCredentials} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-md items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><Search size={18} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un bénéficiaire" className="w-full outline-none" /></label>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700"><Plus size={18} /> Ajouter un bénéficiaire</button>
      </div>
      <DataTable columns={columns} rows={rows} />
      {open && <Modal title="Ajouter un bénéficiaire" onClose={() => setOpen(false)}><BeneficiaireForm onSubmit={add} groups={data.groups} /></Modal>}
    </div>
  );
}

function BeneficiaireForm({ onSubmit, groups }) {
  const [password, setPassword] = useState(generatePassword());
  return <form onSubmit={onSubmit} className="grid gap-4">
    <input name="name" required placeholder="Nom complet" className="rounded-xl border border-slate-200 px-4 py-3" />
    <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3" />
    <input name="phone" placeholder="Téléphone" className="rounded-xl border border-slate-200 px-4 py-3" />
    <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">Groupes</legend>{groups.map((g) => <label key={g.id} className="mb-2 block text-sm"><input type="checkbox" name="groups" value={g.id} /> {g.name}</label>)}</fieldset>
    <select name="status" className="rounded-xl border border-slate-200 px-4 py-3"><option>actif</option><option>archivé</option></select>
    <AccountSection password={password} setPassword={setPassword} />
    <button className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Enregistrer</button>
  </form>;
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
        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">Rôle automatique : bénéficiaire</div>
      </div>
    </section>
  );
}

function AccountActions({ account, onShow, onReset, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onShow} disabled={!account} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40"><Eye size={14} /> Voir identifiants</button>
      <button onClick={onReset} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-indigo-700"><RefreshCcw size={14} /> Réinitialiser mot de passe</button>
      <button onClick={onToggle} disabled={!account} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-amber-700 disabled:opacity-40">{account?.accountStatus === 'suspendu' ? 'Activer' : 'Suspendre'} le compte</button>
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
      <button onClick={onCopy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Copy size={16} /> Copier les identifiants</button>
    </div>
  );
}
