export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="mb-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}
