import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getRestaurantStaffPushTokens } from '@/services/userService';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

    await Promise.all(
      staff.map(async (user) => {
        try {
          await webpush.sendNotification(user.push_token, payloadStr);
          console.log(`[API /notify-staff] 🚀 Successfully sent push to User ID: ${user.id} (Role: ${user.role})`);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.warn(`[API /notify-staff] ❌ Token revoked for User ID: ${user.id}. Removing from DB.`);
            await supabase.from('profiles').update({ push_token: null }).eq('id', user.id);
          } else {
            console.error(`[API /notify-staff] ⚠️ Error sending push to user ${user.id}:`, err);
          }
        }
      })
    );

    return NextResponse.json({ success: true, message: 'Notifications sent successfully' }, { status: 200 });

  } catch (err) {
    console.error("Error in notify-staff route:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
