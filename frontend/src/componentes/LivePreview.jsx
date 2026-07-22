import { badgeEstado, derivarModeloComercial } from '../utils/inventario';

function Row({ label, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex justify-between text-[11px] py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700 text-right max-w-[55%] truncate">{value}</span>
    </div>
  );
}

export default function LivePreview({ form, tmpl }) {
  const checkedCount = tmpl.ficha.checklist.filter(t => form.fichaV2.checklistPruebas[t] === 'OK').length;
  const totalChecklist = tmpl.ficha.checklist.length;
  const condicionFilled = tmpl.ficha.condicion.filter(c => form.fichaV2.condicionEstetica[c]).length;
  const totalCondicion = tmpl.ficha.condicion.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 flex items-center gap-2">
        <i className="fa-solid fa-eye text-white/80 text-xs" />
        <p className="text-[11px] font-bold text-white uppercase tracking-wider">Vista Previa</p>
        <span className="ml-auto text-[10px] font-bold text-white/60">En tiempo real</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="w-full h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-camera text-slate-300 text-xl" />
            <p className="text-[9px] text-slate-300 mt-1">Foto del equipo</p>
          </div>
        </div>

        <div className="space-y-0.5">
          <Row label="Código" value={form.codigo} />
          <Row label="Categoría" value={tmpl.label} />
          <Row label="Marca" value={form.marca} />
          <Row label="Modelo" value={form.modelo} />
          <Row label="Serie" value={form.serie} />
          <Row label="SKU" value={form.sku} />
        </div>

        {(form.procesador || form.ram || form.almacenamiento || form.grafica) && (
          <div className="pt-2 border-t border-slate-100 space-y-0.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hardware</p>
            <Row label="CPU" value={form.procesador} />
            <Row label="RAM" value={`${form.ram || '—'} ${form.tipoRam || ''}`} />
            <Row label="Almacenamiento" value={`${form.almacenamiento || '—'} ${form.tipoDisco || ''}`} />
            <Row label="Gráfica" value={form.grafica} />
          </div>
        )}

        {(form.fichaV2.sistemaOperativo || form.fichaV2.color || form.fichaV2.pantalla || form.fichaV2.modeloComercial) && (
          <div className="pt-2 border-t border-slate-100 space-y-0.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ficha</p>
            <Row label="SO" value={form.fichaV2.sistemaOperativo} />
            <Row label="Color" value={form.fichaV2.color} />
            <Row label="Pantalla" value={form.fichaV2.pantalla} />
            <Row label="Modelo Com." value={form.fichaV2.modeloComercial || derivarModeloComercial(form.marca, form.modelo)} />
          </div>
        )}

        {form.tecnico && (
          <div className="pt-2 border-t border-slate-100 space-y-0.5">
            <Row label="Técnico" value={form.tecnico} />
            <Row label="Batería" value={form.bateria} />
          </div>
        )}

        {(checkedCount > 0 || condicionFilled > 0) && (
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {checkedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(checkedCount / totalChecklist) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600">{checkedCount}/{totalChecklist}</span>
              </div>
            )}
            {condicionFilled > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(condicionFilled / totalCondicion) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-amber-600">{condicionFilled}/{totalCondicion} cond.</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-bold " + badgeEstado(form.estado)}>
            {form.estado}
          </span>
          <span className="text-[9px] text-slate-300 font-mono">{form.fechaRegistro || new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </div>
    </div>
  );
}
