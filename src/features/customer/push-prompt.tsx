import { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth';
import { Button, Modal } from '../../components/ui';
import { toastErr, toastOk } from '../../lib/toast';

const laterKey = 'rs-push-later';

export function PushPrompt() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const customer = Boolean(auth.ready && auth.user?.role === 'Customer' && !auth.user.name.startsWith('Guest_'));

  useEffect(() => {
    if (!customer) {
      setOpen(false);
      return;
    }
    if (sessionStorage.getItem(laterKey) === '1') return;
    let alive = true;
    import('../../lib/push').then(({ getPushPermission }) => getPushPermission().then((permission) => {
      if (!alive) return;
      if (permission === 'granted' || permission === 'unsupported') return;
      setDenied(permission === 'denied');
      setOpen(true);
    }));
    return () => { alive = false; };
  }, [customer, auth.user?.name]);

  async function enable() {
    try {
      const { enableBrowserPush } = await import('../../lib/push');
      await enableBrowserPush();
      setOpen(false);
      toastOk('Notifications are on. Shop offers and order updates can reach this phone.');
    } catch (err) {
      toastErr(err instanceof Error ? err.message : 'Notifications were not turned on.');
    }
  }

  function later() {
    sessionStorage.setItem(laterKey, '1');
    setOpen(false);
  }

  if (!open) return null;
  return (
    <Modal title="Enable notifications first" text="Turn these on before you continue, so offers and order updates reach this phone." onClose={later}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-stone-600">
          {denied
            ? 'Notifications are blocked in this browser. Allow them for this site in the browser settings, then come back.'
            : 'This is the first step after sign-in. Allow notifications so a shop can tell you when an offer or order changes. On iPhone, add Repeat Mate to the Home Screen first.'}
        </p>
        <div className="flex flex-col gap-2">
          {!denied && <Button className="w-full" onClick={enable}>Enable notifications</Button>}
          <Button kind="ghost" className="w-full" onClick={later}>Not now</Button>
        </div>
      </div>
    </Modal>
  );
}
