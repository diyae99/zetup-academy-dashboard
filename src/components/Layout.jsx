import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { logout } from '../utils/auth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles = {
  '/admin': ['Dashboard Admin', 'Vue consolidée des activités pédagogiques et KPIs'],
  '/admin/dashboard': ['Dashboard Admin', 'Vue consolidée des activités pédagogiques et KPIs'],
  '/admin/intervenants': ['Gestion des intervenants', 'Suivi des profils pédagogiques'],
  '/admin/beneficiaires': ['Gestion des bénéficiaires', 'Inscriptions, groupes et progression'],
  '/admin/groupes': ['Gestion des groupes', 'Organisation par langue, niveau et intervenant'],
  '/admin/quizzes': ['Quizzes', 'Catalogue et suivi des évaluations'],
  '/admin/resources': ['Resources', 'Supports pédagogiques disponibles en prévisualisation'],
  '/intervenant': ['Dashboard Intervenant', 'Vos groupes, évaluations et dernières performances'],
  '/intervenant/dashboard': ['Dashboard Intervenant', 'Vos groupes, évaluations et dernières performances'],
  '/intervenant/groupes': ['Mes groupes', 'Détails pédagogiques par groupe'],
  '/intervenant/creer-quiz': ['Créer un quiz', 'Construction question par question'],
  '/intervenant/quizzes': ['Mes quizzes', 'Brouillons, publications et résultats'],
  '/intervenant/resultats': ['Résultats bénéficiaires', 'Scores et points d’attention'],
  '/intervenant/resources': ['Resources', 'Ajout et prévisualisation des supports'],
  '/beneficiaire': ['Dashboard Bénéficiaire', 'Votre progression et vos activités disponibles'],
  '/beneficiaire/dashboard': ['Dashboard Bénéficiaire', 'Votre progression et vos activités disponibles'],
  '/beneficiaire/groupes': ['Mes groupes', 'Vos parcours actifs'],
  '/beneficiaire/quizzes': ['Mes quizzes', 'Évaluations disponibles et résultats'],
  '/beneficiaire/resources': ['Resources', 'Supports à consulter dans la plateforme'],
};

export default function Layout({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] || ['Zetup Académique', 'Plateforme interne'];

  async function handleLogout(event) {
    event?.preventDefault();
    await logout();
    window.location.assign('/login');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:flex">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <Sidebar user={user} onLogout={handleLogout} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar user={user} title={title} subtitle={subtitle} onMenu={() => setMobileOpen(true)} onLogout={handleLogout} />
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
