import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { fechaRegistroTs } from '../utils/inventario';

const InventarioContext = createContext(null);

export function InventarioProvider({ children }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const timerRef = useRef(null);
  const first = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const items = await api.getInventario();
      items.sort((a, b) => fechaRegistroTs(b.fechaRegistro) - fechaRegistroTs(a.fechaRegistro));
      setInventario(items);
    } catch { /* se reintenta en el próximo tick */ }
    finally {
      setLoading(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    timerRef.current = setInterval(() => {
      setActualizando(true);
      cargar();
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [cargar]);

  const refresh = useCallback(() => {
    setActualizando(true);
    return cargar();
  }, [cargar]);

  return (
    <InventarioContext.Provider value={{ inventario, loading, actualizando, refresh }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario() {
  return useContext(InventarioContext);
}
