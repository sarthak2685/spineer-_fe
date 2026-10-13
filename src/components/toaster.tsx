import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

export function Toaster() {
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const sync = () => setPhone(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return (
    <ToastContainer
      position={phone ? 'top-center' : 'top-right'}
      autoClose={3600}
      newestOnTop
      closeOnClick
      pauseOnHover
      pauseOnFocusLoss
      draggable
      draggablePercent={40}
      limit={phone ? 1 : 3}
      theme="light"
    />
  );
}
