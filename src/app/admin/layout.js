import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getRestaurantByOwnerId } from "@/services/restaurantService";
import { getUserProfile } from "@/services/userService";
import AdminLayoutClient from "./AdminLayoutClient";

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
    restaurant = await getRestaurantByOwnerId(user.id);
  }

  return (
    <AdminLayoutClient user={user} restaurant={restaurant}>
      {children}
    </AdminLayoutClient>
  );
}
