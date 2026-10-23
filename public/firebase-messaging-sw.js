// Firebase Cloud Messaging Background Service Worker for KA Plus: Africa Pulse
// Handles background chapter drop push notifications

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Manga Chapter Drop!', body: event.data.text() };
    }
  }

  const notificationTitle = data.notification?.title || data.title || '🔥 New Manga Chapter Released!';
  const notificationOptions = {
    body: data.notification?.body || data.body || 'A brand new chapter has dropped on KA Plus: Africa Pulse. Click to read now!',
    icon: data.notification?.icon || data.coverImage || '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: data.tag || 'chapter-drop',
    data: {
      url: data.data?.url || data.readUrl || '/',
    },
    actions: [
      { action: 'read', title: 'Read Chapter Now 📖' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
