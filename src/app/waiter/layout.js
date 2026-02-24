import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import WaiterLayoutClient from "./WaiterLayoutClient";
import { getUserProfile } from "@/services/userService";

export const metadata = {
  title: "Menu 3D — Waiter",
  manifest: "/manifests/waiter.json",
  icons: {
    icon: "/waiter-icon.jpeg",
    apple: "/waiter-icon.jpeg",
  },
};

export default async function WaiterLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Strict Role Check: Only 'waiter'
  const profile = await getUserProfile(supabase, user?.id);

  if (!profile || (profile.role !== "waiter" && profile.role !== "owner")) {
    redirect("/login");
  }

  return <WaiterLayoutClient>{children}</WaiterLayoutClient>;
}
