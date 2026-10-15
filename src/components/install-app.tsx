import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInstallApp } from '../lib/use-install';

export function SiteInstall() {
  const location = useLocation();
  const { ready, installed, hint, install } = useInstallApp();
  const [hidden, setHidden] = useState(false);
  const onShop = /^\/(play|menu|bill|review)\//.test(location.pathname);
  const onCustomer = location.pathname.startsWith('/customer');
  const onPoster = location.pathname.startsWith('/business/poster') || location.pathname.startsWith('/business/qr');

  if (installed || hidden || onShop || onCustomer || onPoster) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-3 print:hidden">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-orange-200 bg-white/95 py-2 pl-3 pr-1.5 shadow-lg shadow-stone-950/10 backdrop-blur sm:rounded-full sm:py-1.5 sm:pl-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-950">Install Repeat Mate</p>
          <p className="text-[11px] leading-snug text-stone-500">{hint || (ready ? 'Click Install to download it onto this device.' : 'Preparing the download…')}</p>
        </div>
        <button type="button" className="shrink-0 rounded-full bg-orange-600 px-3 py-2 text-sm font-semibold text-white" onClick={install}>Install</button>
        <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-stone-400 hover:bg-stone-100" aria-label="Dismiss" onClick={() => setHidden(true)}>×</button>
      </div>
    </div>
  );
}
