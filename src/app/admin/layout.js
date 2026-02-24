import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getRestaurantByOwnerId, getRestaurantById } from "@/services/restaurantService";
import { getUserProfile } from "@/services/userService";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "Menu 3D — Admin",
  manifest: "/manifests/admin.json",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const profile = await getUserProfile(supabase, user?.id);

  if (profile?.role !== "owner") {
     const { redirect } = await import("next/navigation");
     redirect("/waiter/dashboard");
  }

  let restaurant = null;
  if (user) {
    // 1. Try fetching by Owner ID (for original Owners)
    restaurant = await getRestaurantByOwnerId(user.id);
    
    // 2. If not found, try fetching by Restaurant ID from Profile (for invited Managers)
    if (!restaurant && profile?.restaurant_id) {
        restaurant = await getRestaurantById(profile.restaurant_id);
    }
  }

  return (
    <AdminLayoutClient user={user} restaurant={restaurant}>
      {children}
    </AdminLayoutClient>
  );
}
