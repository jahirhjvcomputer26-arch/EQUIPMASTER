import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = 'fa-box-open',
  title = 'Sin datos',
  description = '',
  actionTo,
  actionLabel,
  onAction,
  secondaryTo,
  secondaryLabel,
  compact = false,
  children,
}) {
  return (
    <div className={`text-center ${compact ? 'py-8 px-4' : 'py-10 px-6'}`}>
      <div className={`mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${compact ? 'w-14 h-14' : 'w-16 h-16'}`}>
        <i className={`fa-solid ${icon} text-slate-300 dark:text-slate-500 ${compact ? 'text-xl' : 'text-2xl'}`} />
      </div>
      <p className={`font-bold text-slate-600 dark:text-slate-300 ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">{description}</p>}
      {(actionTo || onAction || secondaryTo || children) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actionTo && (
            <Link to={actionTo} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-brand text-white text-xs font-bold">
              {actionLabel || 'Continuar'}
            </Link>
          )}
          {!actionTo && onAction && (
            <button type="button" onClick={onAction} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-brand text-white text-xs font-bold">
              {actionLabel || 'Continuar'}
            </button>
          )}
          {secondaryTo && (
            <Link to={secondaryTo} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition">
              {secondaryLabel || 'Ver más'}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
