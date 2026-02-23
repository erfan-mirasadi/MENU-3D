import { supabase } from "@/lib/supabase";
import { removeUserPushToken, updateUserPushToken } from "@/services/userService";

export async function subscribeToPushNotifications(activeRole) {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log("[PushService] No user found, aborting subscription.");
        return;
    }
    console.log("[PushService] Subscribing for user:", user.id);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.log("[PushService] Permission not granted:", permission);
        return;
    }
    console.log("[PushService] Permission granted.");

    const registration = await navigator.serviceWorker.ready;
    
    // Ensure the service worker is fully active before subscribing
    if (registration.active.state !== 'activated') {
      await new Promise((resolve) => {
        registration.active.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    // Convert VAPID key to Uint8Array required by PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Reuse the existing browser subscription to avoid accumulating duplicates in the array.
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    const subscriptionObject = JSON.parse(JSON.stringify(subscription));
    // Attach the active role so the backend knows *which* dashboard this device is currently logged into.
    subscriptionObject.activeRole = activeRole; 

    console.log(`[PushService] Calling updateUserPushToken with role ${activeRole} for endpoint:`, subscriptionObject.endpoint);
    const success = await updateUserPushToken(supabase, user.id, subscriptionObject);
    console.log("[PushService] updateUserPushToken result:", success);

  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
  }
}

// Called on logout: unsubscribes this device from the browser PushManager
// and removes its endpoint from the user's push_token array in the DB.
// Other devices belonging to the same user are preserved.
export async function unsubscribeFromPushNotifications() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const { data: { user } } = await supabase.auth.getUser();
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;

      // Unsubscribe from the browser — stops push events reaching this device.
      await subscription.unsubscribe();

      // Remove this specific endpoint from the user's token array in the DB.
      if (user) {
        await removeUserPushToken(supabase, user.id, endpoint);
      }
    }
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
  }
}

export async function triggerStaffPushNotification(type, restaurantId, tableNumber) {
    if (!restaurantId || !type) return;

    try {
        console.log(`[PushService] Triggering '${type}' notification for Table ${tableNumber} (Restaurant ${restaurantId})...`);
        const res = await fetch('/api/notify-staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, restaurantId, orderDetails: { tableNumber } }),
        });
        
        if (res.ok) {
           console.log(`[PushService] Successfully triggered '${type}' notification API.`);
        } else {
           console.error(`[PushService] Failed to trigger notification API. Status: ${res.status}`);
        }
    } catch (error) {
        console.error(`[PushService] Fetch Error when triggering ${type} push notification:`, error);
    }
}

// Internal Helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
