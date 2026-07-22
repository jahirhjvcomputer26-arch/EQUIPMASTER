import { useEffect } from 'react';

export default function useCtrlEnter(ref, onSubmit) {
  useEffect(() => {
    const el = ref?.current || ref;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmit?.();
      }
    };
    const target = el || window;
    target.addEventListener('keydown', handler);
    return () => target.removeEventListener('keydown', handler);
  }, [ref, onSubmit]);
}
