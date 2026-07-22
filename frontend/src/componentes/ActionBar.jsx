export default function ActionBar({ stepIndex, totalSteps, editing, onPrev, onNext, onSubmit, onCancel }) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          {editing && (
            <button type="button" onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isFirst && (
            <button type="button" onClick={onPrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              <i className="fa-solid fa-arrow-left text-xs" />
              Anterior
            </button>
          )}

          {isFirst && <div />}

          {!isLast ? (
            <button type="button" onClick={onNext}
              className="btn-brand flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold">
              Siguiente
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          ) : (
            <button type="button" onClick={onSubmit}
              className="btn-brand flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold">
              <i className={`fa-solid ${editing ? 'fa-save' : 'fa-plus'} text-xs`} />
              {editing ? 'Guardar Cambios' : 'Registrar Equipo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
