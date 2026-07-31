import { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { fechaRegistroTs } from '../utils/inventario';

const InventarioContext = createContext(null);

export function InventarioProvider({ children }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const invRef = ref(db, 'inventario');
    const unsub = onValue(invRef, (snap) => {
      const data = snap.val();
      const items = data ? Object.values(data) : [];
      items.sort((a, b) => fechaRegistroTs(b.fechaRegistro) - fechaRegistroTs(a.fechaRegistro));
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
