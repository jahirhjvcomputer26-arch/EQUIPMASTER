import { useEffect, useRef } from 'react';

export default function useBrowserNotifications() {
  const permRef = useRef(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') permRef.current = true;
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { permRef.current = p === 'granted'; });
    }
  }, []);

  const notify = (title, body) => {
    if (permRef.current) {
      try { new Notification(title, { body, icon: '/logo-empresa.png' }); } catch {}
    }
  };

  return notify;
}
