import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Guest shop tabs manage their own scroll (hero → content). */
function isGuestShopPath(pathname: string) {
  return /^\/(play|menu|bill|review)\//.test(pathname);
}

/** On every route change, open the page from the top (hash in-page jumps are left alone). */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    if (isGuestShopPath(pathname)) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash, key]);

  return null;
}
