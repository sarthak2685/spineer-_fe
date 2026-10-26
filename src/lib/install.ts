export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallWindow = Window & { __rsInstall?: InstallPromptEvent | null };

let waiting: InstallPromptEvent | null = null;
const listeners = new Set<(event: InstallPromptEvent | null) => void>();

function stashed() {
  return (window as InstallWindow).__rsInstall || waiting;
}

function setStashed(event: InstallPromptEvent | null) {
  waiting = event;
  (window as InstallWindow).__rsInstall = event;
}

function publish() {
  const current = stashed();
  listeners.forEach((listener) => listener(current));
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1;
  return iOS || iPadOs;
}

export function runningAsApp() {
  const standaloneNav = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneNav
    || window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches;
}

export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    setStashed(event as InstallPromptEvent);
    publish();
  });
  window.addEventListener('rs-install-ready', publish);
  window.addEventListener('appinstalled', () => {
    setStashed(null);
    publish();
  });
}

export function watchInstallPrompt(listener: (event: InstallPromptEvent | null) => void) {
  listeners.add(listener);
  listener(stashed());
  return () => listeners.delete(listener);
}

export function openInstallGuide() {
  window.dispatchEvent(new CustomEvent('rs-install-guide'));
}

export function requestInstall() {
  const current = stashed();
  if (!current) {
    openInstallGuide();
    return Promise.resolve('unavailable' as const);
  }
  const pending = current.prompt();
  setStashed(null);
  listeners.forEach((listener) => listener(null));
  return pending
    .then(() => current.userChoice)
    .then((choice) => choice.outcome)
    .catch(() => {
      openInstallGuide();
      return 'unavailable' as const;
    });
}
