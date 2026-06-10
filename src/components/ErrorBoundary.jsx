import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Erreur React capturée', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
          <div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
            <h1 className="text-xl font-black text-slate-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-slate-500">La page n’a pas pu être affichée correctement. Revenez au tableau de bord ou rechargez la page.</p>
            <button onClick={() => window.location.assign('/')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700">
              Retour au tableau de bord
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
