import { api } from '../api/client';

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

export async function enableBrowserPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('This browser does not support push notifications.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const { publicKey } = await api<{ publicKey: string }>('/public/push/vapid');
  if (!publicKey) throw new Error('Push is not configured on the server yet.');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api('/customer/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ token: JSON.stringify(subscription.toJSON()), action: 'subscribe' }),
  });
  return subscription;
}

export async function disableBrowserPush() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await api('/customer/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ token: JSON.stringify(subscription.toJSON()), action: 'unsubscribe' }),
  }).catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}
