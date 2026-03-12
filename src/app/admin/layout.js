import {
  getRestaurantByOwnerId,
  getRestaurantById,
} from "@/services/restaurantService";
import { getServerAuthContext } from "@/services/authServerService";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "Menu 3D — Admin",
  applicationName: "Admin",
  manifest: "/manifests/admin.json",
  appleWebApp: {
    capable: true,
    title: "Admin",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export const viewport = {
  themeColor: "#1f1d2b",
};

export default async function AdminLayout({ children }) {
  const { user, profile } = await getServerAuthContext();

  if (!profile || profile.role !== "owner") {
    const { redirect } = await import("next/navigation");
    redirect("/login?role=owner");
  }

  let restaurant = null;
  if (user) {
    // Try fetching by Owner ID (for original Owners)
    restaurant = await getRestaurantByOwnerId(user.id);

    // If not found, try fetching by Restaurant ID from Profile (for invited Managers)
    if (!restaurant && profile?.restaurant_id) {
      restaurant = await getRestaurantById(profile.restaurant_id);
    }
  }

  return (
    <>
      <style>{`
        body { background-color: #1f1d2b !important; }
      `}</style>
      <AdminLayoutClient user={user} restaurant={restaurant}>
        {children}
      </AdminLayoutClient>
    </>
  );
}
