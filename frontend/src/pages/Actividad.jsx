import { useEffect, useState } from 'react';
import { api } from '../services/api';
import useDocumentTitle from '../utils/useDocumentTitle';
import { SkeletonTable } from '../componentes/Skeleton';

const COLOR_ACCION = {
  EQUIPO_REGISTRADO: 'text-emerald-600 bg-emerald-50',
  EQUIPO_EDITADO: 'text-blue-600 bg-blue-50',
  EQUIPO_ELIMINADO: 'text-red-600 bg-red-50',
  VENTA_LOCAL: 'text-purple-600 bg-purple-50',
  VENTA_ML: 'text-indigo-600 bg-indigo-50',
  DEVOLUCION: 'text-orange-600 bg-orange-50',
  PRESTAMO: 'text-cyan-600 bg-cyan-50',
  DEVOLUCION_PRESTAMO: 'text-teal-600 bg-teal-50',
};

const LABEL_ACCION = {
  EQUIPO_REGISTRADO: 'Registro',
  EQUIPO_EDITADO: 'Edición',
  EQUIPO_ELIMINADO: 'Eliminación',
  VENTA_LOCAL: 'Venta Local',
  VENTA_ML: 'Venta ML',
  DEVOLUCION: 'Devolución',
  PRESTAMO: 'Préstamo',
  DEVOLUCION_PRESTAMO: 'Dev. Préstamo',
};

export default function Actividad() {
  useDocumentTitle('Historial');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.getActividad(page).then(r => { setData(r.data); setTotal(r.total); setLoading(false); }).catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Historial de Actividad</h2>
        <p className="text-slate-500 text-sm">Auditoría de todas las acciones en el sistema ({total} registros)</p>
      </div>

      <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '50ms' }}>
        {loading ? (
          <SkeletonTable rows={8} cols={4} />
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-clock-rotate-left text-3xl mb-2" /><p className="text-sm">Sin actividad registrada</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm table-responsive">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Fecha / Hora</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Usuario</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Acción</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono" data-label="Fecha">
                        {new Date(item.fecha).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium" data-label="Usuario">{item.usuario}</td>
                      <td className="px-6 py-4" data-label="Acción">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${COLOR_ACCION[item.accion] || 'bg-slate-100 text-slate-600'}`}>
                          {LABEL_ACCION[item.accion] || item.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600" data-label="Detalle">{item.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition">Anterior</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition">Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
