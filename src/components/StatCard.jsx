export default function StatCard({ title, value, icon: Icon, hint, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
