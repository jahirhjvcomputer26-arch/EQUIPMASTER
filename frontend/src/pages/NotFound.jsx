import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-6 text-4xl">
          <i className="fa-solid fa-compass" />
        </div>
        <h1 className="font-display text-5xl font-extrabold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 text-lg mb-2">Página no encontrada</p>
        <p className="text-slate-400 text-sm mb-8">La ruta que buscas no existe o fue movida.</p>
        <Link to="/" className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold">
          <i className="fa-solid fa-arrow-left" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
