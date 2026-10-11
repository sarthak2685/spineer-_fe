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

export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
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

export function runningAsApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
}

export function requestInstall() {
  const current = stashed();
  if (!current) return Promise.resolve('unavailable' as const);
  const pending = current.prompt();
  setStashed(null);
  listeners.forEach((listener) => listener(null));
  return pending
    .then(() => current.userChoice)
    .then((choice) => choice.outcome)
    .catch(() => 'unavailable' as const);
}
