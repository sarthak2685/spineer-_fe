import { api } from '../api/client';

export type PushRole = 'customer' | 'business';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getPushPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported' as const;
  }
  return Notification.permission;
}

export async function enableBrowserPush(options?: { role?: PushRole }) {
  const role = options?.role || 'customer';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('This browser does not support push notifications.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const { publicKey } = await api<{ publicKey: string }>('/public/push/vapid');
  if (!publicKey) throw new Error('Push is not configured on the server yet.');

  const registration = await navigator.serviceWorker.ready;
  let existing = await registration.pushManager.getSubscription();
  const saved = existing?.toJSON();
  if (!saved?.endpoint || !saved.keys?.p256dh || !saved.keys?.auth) {
    await existing?.unsubscribe().catch(() => undefined);
    existing = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const subscription = existing;
  if (!subscription) throw new Error('This browser did not finish turning alerts on. Try again.');
  const next = subscription.toJSON();
  if (!next.endpoint || !next.keys?.p256dh || !next.keys?.auth) {
    throw new Error('This browser did not finish turning alerts on. Try again.');
  }

  const path = role === 'business' ? '/business/push/subscribe' : '/customer/push/subscribe';
  await api(path, {
    method: 'POST',
    body: JSON.stringify({ token: JSON.stringify(next), action: 'subscribe' }),
  });
  return subscription;
}

export async function disableBrowserPush(options?: { role?: PushRole }) {
  const role = options?.role || 'customer';
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const path = role === 'business' ? '/business/push/subscribe' : '/customer/push/subscribe';
  await api(path, {
    method: 'POST',
    body: JSON.stringify({ token: JSON.stringify(subscription.toJSON()), action: 'unsubscribe' }),
  }).catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}
