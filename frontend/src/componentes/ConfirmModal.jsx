export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
            <i className={`fa-solid ${danger ? 'fa-triangle-exclamation' : 'fa-question-circle'} text-xl`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'btn-brand'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
