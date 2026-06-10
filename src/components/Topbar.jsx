import { LogOut, Menu } from 'lucide-react';
import Badge from './Badge';

const roleLabels = { admin: 'Admin', intervenant: 'Intervenant', beneficiaire: 'Bénéficiaire' };

export default function Topbar({ user, title, subtitle, onMenu, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#F8FAFC]/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenu} className="rounded-xl p-2 text-slate-600 hover:bg-white lg:hidden" aria-label="Ouvrir le menu">
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/70">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <Badge tone={user.role}>{roleLabels[user.role]}</Badge>
          <a href="/login" onClick={onLogout} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Déconnexion">
            <LogOut size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
