
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      // 1. Parse the JSON payload sent from the backend
      const payload = event.data.json();
      console.log("[Service Worker] Received push event:", payload);
      
      const title = payload.title || 'New Order Alert';
      const options = {
        body: payload.body || 'You have a new update.',
        icon: '/images/default-logo.png', // Or your app's actual icon if you have one
        badge: '/images/default-logo.png', // Optional monochrome badge icon
        data: payload.data || {},        // Custom payload data (e.g. redirect urls)
        vibrate: [200, 100, 200]         // Vibrate pattern for mobile devices
      };

      // 2. Hand it over to the browser to display
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      // Fallback in case the server sent plain text instead of JSON
      const fallbackText = event.data.text();
      event.waitUntil(
        self.registration.showNotification('System Alert', {
          body: fallbackText
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetPath = event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If the app is already open, focus it and navigate to the right path
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
