import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!show) return null;

  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Volver arriba"
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition flex items-center justify-center animate-fade-in">
      <i className="fa-solid fa-arrow-up" />
    </button>
  );
}
