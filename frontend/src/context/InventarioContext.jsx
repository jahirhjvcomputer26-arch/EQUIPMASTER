import { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';

const InventarioContext = createContext(null);

export function InventarioProvider({ children }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const invRef = ref(db, 'inventario');
    const unsub = onValue(invRef, (snap) => {
      const data = snap.val();
      const items = data ? Object.values(data) : [];
      items.sort((a, b) => {
        const fa = a.fechaRegistro || '';
        const fb = b.fechaRegistro || '';
        return fb.localeCompare(fa);
      });
      setInventario(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return (
    <InventarioContext.Provider value={{ inventario, loading }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario() {
  return useContext(InventarioContext);
}
