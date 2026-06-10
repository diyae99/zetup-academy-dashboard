import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { login, roleHome } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.user) {
      setError(result.error || 'Identifiants invalides.');
      return;
    }
    window.location.assign(roleHome(result.user.role));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center px-6 py-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">ZA</div>
            <h1 className="mt-8 text-4xl font-black tracking-tight text-slate-950">Zetup Académique</h1>
            <p className="mt-3 text-slate-500">Connectez-vous avec votre compte Zetup Académique.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <span className="mt-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <Mail size={18} className="text-slate-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Mot de passe</span>
                <span className="mt-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <LockKeyhole size={18} className="text-slate-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full outline-none" />
                </span>
              </label>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Connexion...' : 'Se connecter'} <ArrowRight size={18} />
              </button>
            </form>
            <p className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">Compte administrateur configuré via Supabase.</p>
          </div>
        </section>
        <section className="hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-10 text-white lg:flex lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">MVP Frontend</p>
            <h2 className="mt-4 max-w-xl text-5xl font-black leading-tight">Piloter groupes, quizzes, ressources et progression depuis un même espace.</h2>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {['6 groupes', '8 quizzes', '10 resources'].map((item) => <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold backdrop-blur">{item}</div>)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
