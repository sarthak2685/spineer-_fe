import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** On every route change, open the page from the top (hash in-page jumps are left alone). */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash, key]);

  return null;
}
