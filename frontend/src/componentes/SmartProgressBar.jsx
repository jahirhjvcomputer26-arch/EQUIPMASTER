export default function SmartProgressBar({ stepIndex, totalSteps, stepLabels, stepIcons }) {
  const percent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          <i className="fa-solid fa-route text-brand-500 mr-1.5" />
          Paso {stepIndex + 1} de {totalSteps}
        </p>
        <span className="text-xs font-extrabold text-brand-600">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: percent + '%',
            background: 'linear-gradient(90deg, #0018B0, #FF9100)',
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 ${i < totalSteps - 1 ? 'flex-1' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 shrink-0 ${
                i === stepIndex ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-110' :
                i < stepIndex ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {i < stepIndex ? <i className="fa-solid fa-check text-[9px]" /> : <i className={`fa-solid ${stepIcons?.[i] || 'fa-circle'} text-[9px]`} />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${
                i === stepIndex ? 'text-brand-600' : i < stepIndex ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {stepLabels?.[i] || `Paso ${i + 1}`}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-500 ${
                i < stepIndex ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
