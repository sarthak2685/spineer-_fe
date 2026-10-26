import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInstallApp } from '../lib/use-install';
import { isIosDevice } from '../lib/install';
import { Button, Modal } from './ui';

export function SiteInstall() {
  const location = useLocation();
  const { ready, installed, hint, install, ctaLabel, ios } = useInstallApp();
  const [hidden, setHidden] = useState(false);
  const [guide, setGuide] = useState(false);
  const onShop = /^\/(play|menu|bill|review)\//.test(location.pathname);

  useEffect(() => {
    const open = () => setGuide(true);
    window.addEventListener('rs-install-guide', open);
    return () => window.removeEventListener('rs-install-guide', open);
  }, []);

  if (installed || hidden || onShop) {
    return guide ? <InstallGuideModal onClose={() => setGuide(false)} /> : null;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-3 print:hidden">
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-orange-200 bg-white/95 py-2 pl-3 pr-1.5 shadow-lg shadow-stone-950/10 backdrop-blur sm:rounded-full sm:py-1.5 sm:pl-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-950">Install Repeat Mate</p>
            <p className="text-[11px] leading-snug text-stone-500">{hint || (ready ? 'Click Install to download it onto this device.' : 'Preparing the download…')}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              if (ios) setGuide(true);
              else void install();
            }}
          >
            {ctaLabel}
          </button>
          <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-stone-400 hover:bg-stone-100" aria-label="Dismiss" onClick={() => setHidden(true)}>×</button>
        </div>
      </div>
      {guide ? <InstallGuideModal onClose={() => setGuide(false)} /> : null}
    </>
  );
}

function InstallGuideModal({ onClose }: { onClose: () => void }) {
  const ios = isIosDevice();
  return (
    <Modal
      title={ios ? 'Add to Home Screen' : 'Install Repeat Mate'}
      text={ios
        ? 'iPhone does not support one-tap install. Use Share to put the app on your Home Screen.'
        : 'If the install sheet did not open, use your browser menu to install this site as an app.'}
      onClose={onClose}
    >
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-600">
        {ios ? (
          <>
            <li>Tap the <span className="font-semibold text-stone-900">Share</span> button in Safari.</li>
            <li>Choose <span className="font-semibold text-stone-900">Add to Home Screen</span>.</li>
            <li>Tap <span className="font-semibold text-stone-900">Add</span>, then open Repeat Mate from the Home Screen icon.</li>
          </>
        ) : (
          <>
            <li>Open the browser menu (⋮ or ⋯).</li>
            <li>Choose <span className="font-semibold text-stone-900">Install app</span> or <span className="font-semibold text-stone-900">Add to Home screen</span>.</li>
            <li>Confirm, then open the app from your home screen or app drawer.</li>
          </>
        )}
      </ol>
      <Button className="mt-5 w-full" onClick={onClose}>Got it</Button>
    </Modal>
  );
}
