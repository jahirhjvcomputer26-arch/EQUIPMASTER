export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 p-4 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-slate-50">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-4 bg-slate-100 rounded ${c === 0 ? 'w-16' : c === cols - 1 ? 'w-20' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 5 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-5 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="panel p-6 animate-pulse min-h-[400px] flex flex-col">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
      <div className="flex-1 bg-slate-100 rounded-xl" />
    </div>
  );
}
