import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, roleHome } from './utils/auth';
import { initialData } from './data/mockData';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIntervenants from './pages/admin/AdminIntervenants';
import AdminBeneficiaires from './pages/admin/AdminBeneficiaires';
import AdminGroups from './pages/admin/AdminGroups';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminResources from './pages/admin/AdminResources';
import IntervenantDashboard from './pages/intervenant/IntervenantDashboard';
import IntervenantGroups from './pages/intervenant/IntervenantGroups';
import CreateQuiz from './pages/intervenant/CreateQuiz';
import IntervenantQuizzes from './pages/intervenant/IntervenantQuizzes';
import IntervenantResults from './pages/intervenant/IntervenantResults';
import IntervenantResources from './pages/intervenant/IntervenantResources';
import BeneficiaireDashboard from './pages/beneficiaire/BeneficiaireDashboard';
import BeneficiaireGroups from './pages/beneficiaire/BeneficiaireGroups';
import BeneficiaireQuizzes from './pages/beneficiaire/BeneficiaireQuizzes';
import QuizPlayer from './pages/beneficiaire/QuizPlayer';
import BeneficiaireResources from './pages/beneficiaire/BeneficiaireResources';

const DATA_KEY = 'zetup_mock_data';
const DATA_VERSION_KEY = 'zetup_mock_data_version';
const DATA_VERSION = '2026-06-08-demo-2';
const DataContext = createContext(null);

function loadData() {
  try {
    if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
      localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
      localStorage.setItem(DATA_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(localStorage.getItem(DATA_KEY)) || initialData;
  } catch {
    return initialData;
  }
}

export function useAppData() {
  return useContext(DataContext);
}

function DataProvider({ children }) {
  const [data, setDataState] = useState(loadData);
  const setData = (updater) => {
    setDataState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
      return next;
    });
  };
  const value = useMemo(() => ({ data, setData }), [data]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function AuthStatus({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
        {children}
      </div>
    </div>
  );
}

function RequireRole({ role, user, loading, profileError }) {
  const location = useLocation();
  if (loading) return <AuthStatus><p className="font-bold text-slate-900">Chargement de la session...</p></AuthStatus>;
  if (profileError) return <AuthStatus><p className="font-bold text-rose-700">{profileError}</p></AuthStatus>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />;
  return <Layout user={user} />;
}

export default function App() {
  const [authState, setAuthState] = useState({ user: null, loading: true, profileError: null });

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user, error }) => {
      if (active) setAuthState({ user, loading: false, profileError: error });
    });
    return () => {
      active = false;
    };
  }, []);

  const { user, loading, profileError } = authState;
  return (
    <ErrorBoundary>
      <DataProvider>
        <Routes>
          <Route path="/login" element={loading ? <AuthStatus><p className="font-bold text-slate-900">Chargement de la session...</p></AuthStatus> : user ? <Navigate to={roleHome(user.role)} replace /> : <Login />} />
          <Route path="/admin" element={<RequireRole role="admin" user={user} loading={loading} profileError={profileError} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="intervenants" element={<AdminIntervenants />} />
            <Route path="beneficiaires" element={<AdminBeneficiaires />} />
            <Route path="groupes" element={<AdminGroups />} />
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="resources" element={<AdminResources />} />
          </Route>
          <Route path="/intervenant" element={<RequireRole role="intervenant" user={user} loading={loading} profileError={profileError} />}>
            <Route index element={<Navigate to="/intervenant/dashboard" replace />} />
            <Route path="dashboard" element={<IntervenantDashboard user={user} />} />
            <Route path="groupes" element={<IntervenantGroups user={user} />} />
            <Route path="creer-quiz" element={<CreateQuiz user={user} />} />
            <Route path="quizzes" element={<IntervenantQuizzes user={user} />} />
            <Route path="resultats" element={<IntervenantResults user={user} />} />
            <Route path="resources" element={<IntervenantResources user={user} />} />
          </Route>
          <Route path="/beneficiaire" element={<RequireRole role="beneficiaire" user={user} loading={loading} profileError={profileError} />}>
            <Route index element={<Navigate to="/beneficiaire/dashboard" replace />} />
            <Route path="dashboard" element={<BeneficiaireDashboard user={user} />} />
            <Route path="groupes" element={<BeneficiaireGroups user={user} />} />
            <Route path="quizzes" element={<BeneficiaireQuizzes user={user} />} />
            <Route path="quizzes/:quizId" element={<QuizPlayer user={user} />} />
            <Route path="resources" element={<BeneficiaireResources user={user} />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? roleHome(user.role) : '/login'} replace />} />
        </Routes>
      </DataProvider>
    </ErrorBoundary>
  );
}
