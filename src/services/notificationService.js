import { supabase } from "@/lib/supabase";
import { updateUserPushToken } from "@/services/userService";

export async function subscribeToPushNotifications() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    // Convert VAPID key to Uint8Array required by PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Save token using our consolidated user service
    const subscriptionObject = JSON.parse(JSON.stringify(subscription));
    await updateUserPushToken(supabase, user.id, subscriptionObject);

  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
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
