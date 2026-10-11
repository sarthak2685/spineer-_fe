import { useEffect, useState } from 'react';
import { requestInstall, runningAsApp, watchInstallPrompt } from './install';

export function useInstallApp() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(() => runningAsApp());
  const [hint, setHint] = useState('');

  useEffect(() => {
    const stop = watchInstallPrompt((event) => {
      setReady(Boolean(event));
      if (event) setHint('');
    });
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      stop();
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    const outcome = await requestInstall();
    if (outcome === 'accepted') setInstalled(true);
  }

  const help = hint || (ready
    ? 'Click Install, then confirm the browser window. RewardSpinner is added to the Start menu. No file is saved in Downloads.'
    : '');

  return { ready, installed, hint: help, install };
}
