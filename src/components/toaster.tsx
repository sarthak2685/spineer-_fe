import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

function isGuestShopPath(pathname: string) {
  return /^\/(play|menu|bill|review)\//.test(pathname);
}

export function Toaster() {
  const location = useLocation();
  const guestShop = isGuestShopPath(location.pathname);
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const sync = () => setPhone(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('toast-guest-shop', guestShop);
    return () => document.documentElement.classList.remove('toast-guest-shop');
  }, [guestShop]);
  return (
    <ToastContainer
      position={guestShop && phone ? 'bottom-center' : phone ? 'top-center' : 'top-right'}
      autoClose={3000}
      newestOnTop
      closeOnClick={!guestShop}
      pauseOnHover
      pauseOnFocusLoss
      draggable
      draggablePercent={40}
      limit={phone ? 1 : 3}
      theme="light"
      className={guestShop ? 'Toastify__toast-container--guest-shop' : undefined}
    />
  );
}
