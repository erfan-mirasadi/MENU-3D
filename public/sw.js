
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      // 1. Parse the JSON payload sent from the backend
      const payload = event.data.json();
      console.log("[Service Worker] Received push event:", payload);
      
      const title = payload.title || 'New Order Alert';

      // Pick icon based on the notification's target role
      const targetUrl = payload.data?.url || '';
      let notifIcon = '/logo.jpeg'; // fallback
      if (targetUrl.includes('/chef')) {
        notifIcon = '/chef-icon.jpeg';
      } else if (targetUrl.includes('/waiter') || targetUrl.includes('/cashier')) {
        notifIcon = '/waiter-icon.jpeg';
      }

      const options = {
        body: payload.body || 'You have a new update.',
        icon: notifIcon, 
        badge: notifIcon, 
        data: payload.data || {},        
        vibrate: [200, 100, 200]         
      };

      // Owners receive all notifications from the backend. 
      // We filter them locally based on which panel they currently have open.
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          
          let shouldShow = true; 
          const targetUrl = options.data?.url || '';

          if (clientList.length > 0) {

             
             const hasAdminOpen = clientList.some(c => c.url.includes('/admin'));
             const hasChefOpen = clientList.some(c => c.url.includes('/chef'));
             const hasWaiterOpen = clientList.some(c => c.url.includes('/waiter') || c.url.includes('/cashier'));

             if (!hasAdminOpen) {
                 if (targetUrl.includes('/chef') && !hasChefOpen && hasWaiterOpen) {
                     shouldShow = false; // Drop chef notification if only waiter is open
                 } else if (targetUrl.includes('/waiter') && !hasWaiterOpen && hasChefOpen) {
                     shouldShow = false; // Drop waiter notification if only chef is open
                 }
             }
          }

          if (shouldShow) {
            return self.registration.showNotification(title, options);
          } else {
            console.log("[Service Worker] Ignored notification because user is in a different panel.");
          }
        })
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
