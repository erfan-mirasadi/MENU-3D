import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getRestaurantStaffPushTokens, removeUserPushToken } from '@/services/userService';

// Supabase admin client — uses service role to bypass RLS when reading push tokens.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Maps each notification event type to its target roles and message content.
const NOTIFICATION_PAYLOADS = {
  NEW_ORDER: (tableNumber) => ({
    targetRoles: ['waiter'],
    payload: {
      title: '🔔 New Order Pending',
      body: `Table ${tableNumber} has a new order needing confirmation.`,
      data: { url: '/waiter' }
    }
  }),
  PREPARING: (tableNumber) => ({
    targetRoles: ['chef'],
    payload: {
      title: '👨‍🍳 Kitchen Alert',
      body: `Order for Table ${tableNumber} is ready to be prepared!`,
      data: { url: '/chef' }
    }
  }),
  SERVED: (tableNumber) => ({
    targetRoles: ['waiter'],
    payload: {
      title: '✅ Food Ready',
      body: `Order for Table ${tableNumber} is ready to serve!`,
      data: { url: '/waiter' }
    }
  })
};

export async function POST(request) {
  try {
    // VAPID must be set inside the handler to ensure env vars are available at runtime.
    webpush.setVapidDetails(
      'mailto:support@menu-3d.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { orderDetails, restaurantId, type } = await request.json();
    const tableNumber = orderDetails?.tableNumber || '?';

    const notificationConfig = NOTIFICATION_PAYLOADS[type];
    if (!notificationConfig) {
      return NextResponse.json({ message: 'No push notification required for this event type.' }, { status: 200 });
    }

    const { targetRoles, payload } = notificationConfig(tableNumber);
    const staff = await getRestaurantStaffPushTokens(supabase, restaurantId, targetRoles);

    if (!staff?.length) {
      return NextResponse.json({ message: 'No subscribed staff found.' }, { status: 200 });
    }

    const payloadStr = JSON.stringify(payload);

    // For each staff member, iterate over their array of device subscriptions.
    await Promise.all(
      staff.map(async (user) => {
        // Normalize: push_token can be an array (new) or a single object (legacy).
        const subscriptions = Array.isArray(user.push_token)
          ? user.push_token
          : user.push_token ? [user.push_token] : [];

        await Promise.all(
          subscriptions.map(async (subscription) => {
            try {
              await webpush.sendNotification(subscription, payloadStr);
              console.log(`[API /notify-staff] 🚀 Sent push to User ${user.id} on endpoint: ...${subscription.endpoint.slice(-20)}`);
            } catch (err) {
              // 404/410 means the subscription is expired or revoked — remove it from the array.
              if (err.statusCode === 404 || err.statusCode === 410) {
                console.warn(`[API /notify-staff] ❌ Stale token for User ${user.id}. Removing endpoint.`);
                await removeUserPushToken(supabase, user.id, subscription.endpoint);
              } else {
                console.error(`[API /notify-staff] ⚠️ Error sending push to User ${user.id}:`, err.message);
              }
            }
          })
        );
      })
    );

    return NextResponse.json({ success: true, message: 'Notifications sent successfully.' }, { status: 200 });

  } catch (err) {
    console.error("Error in notify-staff route:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
