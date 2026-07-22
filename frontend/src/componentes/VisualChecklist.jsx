import { CHECKLIST_ICONS } from '../utils/formTemplates';

const STATUS_COLORS = {
  OK: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: 'text-emerald-500' },
  FAIL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: 'text-red-500' },
  PENDING: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', icon: 'text-slate-300' },
};

function getStatus(test, result) {
  if (result === 'OK' || result === true) return 'OK';
  if (result === 'FAIL' || result === false) return 'FAIL';
  return 'PENDING';
}

export default function VisualChecklist({ items, results, onToggle, compact }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {items.map(test => {
        const status = getStatus(test, results[test]);
        const colors = STATUS_COLORS[status];
        const meta = CHECKLIST_ICONS[test] || { icon: 'fa-circle-question', color: 'text-slate-400' };

        return (
          <button
            key={test}
            type="button"
            onClick={() => onToggle(test)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-[1.02] ${colors.bg} ${colors.border} ${colors.text}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${status === 'OK' ? 'bg-emerald-100' : status === 'FAIL' ? 'bg-red-100' : 'bg-slate-100'}`}>
              <i className={`fa-solid ${status === 'OK' ? 'fa-circle-check' : status === 'FAIL' ? 'fa-circle-xmark' : meta.icon} ${colors.icon}`} />
            </div>
            <span className="flex-1 text-left">{test}</span>
            {status === 'OK' && <i className="fa-solid fa-check-circle text-emerald-500 text-sm" />}
            {status === 'FAIL' && <i className="fa-solid fa-xmark-circle text-red-500 text-sm" />}
            {status === 'PENDING' && <i className="fa-regular fa-circle text-slate-300 text-sm" />}
          </button>
        );
      })}
    </div>
  );
}
