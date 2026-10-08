self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'RewardSpinner', body: 'You have a new update.', url: '/customer/notifications' };
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
  event.waitUntil(
    self.registration.showNotification(data.title || 'RewardSpinner', {
      body: data.body || '',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: { url: data.url || '/customer/notifications' },
    }),
  );
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
