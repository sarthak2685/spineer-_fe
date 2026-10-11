self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  let data = { title: 'RewardSpinner', body: 'You have a new update.', url: '/customer/notifications', tag: 'rewardspinner' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }
  const title = data.title || 'RewardSpinner';
  const body = data.body || '';
  const url = data.url || '/customer/notifications';
  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: data.tag || title,
      renotify: true,
      data: { url },
    });
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach((client) => client.postMessage({ type: 'push', title, body, url }));
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/customer/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    }),
  );
});
