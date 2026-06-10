import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpen, ClipboardList, FolderOpen, GraduationCap, Home, Library, LogOut, UsersRound } from 'lucide-react';

const nav = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { to: '/admin/intervenants', label: 'Intervenants', icon: GraduationCap },
    { to: '/admin/beneficiaires', label: 'Bénéficiaires', icon: UsersRound },
    { to: '/admin/groupes', label: 'Groupes', icon: BookOpen },
    { to: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
    { to: '/admin/resources', label: 'Resources', icon: Library },
  ],
  intervenant: [
    { to: '/intervenant/dashboard', label: 'Dashboard', icon: Home },
    { to: '/intervenant/groupes', label: 'Mes groupes', icon: BookOpen },
    { to: '/intervenant/creer-quiz', label: 'Créer un quiz', icon: ClipboardList },
    { to: '/intervenant/quizzes', label: 'Mes quizzes', icon: FolderOpen },
    { to: '/intervenant/resultats', label: 'Résultats', icon: BarChart3 },
    { to: '/intervenant/resources', label: 'Resources', icon: Library },
  ],
  beneficiaire: [
    { to: '/beneficiaire/dashboard', label: 'Dashboard', icon: Home },
    { to: '/beneficiaire/groupes', label: 'Mes groupes', icon: BookOpen },
    { to: '/beneficiaire/quizzes', label: 'Mes quizzes', icon: ClipboardList },
    { to: '/beneficiaire/resources', label: 'Resources', icon: Library },
  ],
};

export default function Sidebar({ user, onLogout, mobileOpen, onClose }) {
  const items = nav[user.role] || [];
  return (
    <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-5 text-white transition-transform lg:static lg:translate-x-0`}>
      <div className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-black">ZA</div>
        <h1 className="mt-4 text-xl font-black">Zetup Académique</h1>
        <p className="mt-1 text-sm text-indigo-100/70">Gestion linguistique interne</p>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-indigo-950 shadow-lg' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <a href="/login" onClick={onLogout} className="mt-6 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-indigo-100 hover:bg-white/10 hover:text-white">
        <LogOut size={19} /> Déconnexion
      </a>
    </aside>
  );
}
