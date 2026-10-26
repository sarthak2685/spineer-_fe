import { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth';
import { Button, Modal } from '../../components/ui';
import { toastErr, toastOk } from '../../lib/toast';

const laterKey = 'rs-owner-push-later';

export function OwnerPushPrompt() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const owner = Boolean(auth.ready && auth.user?.role === 'BusinessAdmin');

  useEffect(() => {
    if (!owner) {
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
  }, [owner]);

  async function enable() {
    try {
      const { enableBrowserPush } = await import('../../lib/push');
      await enableBrowserPush({ role: 'business' });
      setOpen(false);
      toastOk('Order alerts are on. New orders can reach this phone when the browser is closed.');
    } catch (err) {
      toastErr(err instanceof Error ? err.message : 'Order alerts were not turned on.');
    }
  }

  function later() {
    sessionStorage.setItem(laterKey, '1');
    setOpen(false);
  }

  if (!open) return null;
  return (
    <Modal title="Turn on order alerts" text="So new orders reach this phone even when the screen is off or the browser is closed." onClose={later}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-stone-600">
          {denied
            ? 'Notifications are blocked in this browser. Allow them for this site in the browser settings, then come back.'
            : 'Allow notifications so you hear new orders at the counter. On iPhone, add Repeat Mate to the Home Screen first, then open it from the icon and allow alerts.'}
        </p>
        <div className="flex flex-col gap-2">
          {!denied && <Button className="w-full" onClick={enable}>Enable order alerts</Button>}
          <Button kind="ghost" className="w-full" onClick={later}>Not now</Button>
        </div>
      </div>
    </Modal>
  );
}
