import { useEffect, useState } from 'react';
import { isIosDevice, requestInstall, runningAsApp, watchInstallPrompt } from './install';

const IOS_HINT = 'Tap Share, then Add to Home Screen.';
const ANDROID_WAIT = 'Preparing the download…';
const ANDROID_READY = 'Click Install to download it onto this device.';

export function useInstallApp() {
  const ios = isIosDevice();
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(() => runningAsApp());
  const [hint, setHint] = useState(() => (ios ? IOS_HINT : ANDROID_WAIT));

  useEffect(() => {
    const stop = watchInstallPrompt((event) => {
      setReady(Boolean(event));
      if (event) setHint(ANDROID_READY);
      else if (isIosDevice()) setHint(IOS_HINT);
      else setHint(ANDROID_WAIT);
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

  return {
    ready: ready || ios,
    installed,
    install,
    hint,
    ctaLabel: ios ? 'Add to Home Screen' : 'Install',
    ios,
  };
}
