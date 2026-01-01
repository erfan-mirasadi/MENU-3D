import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import WaiterLayoutClient from "./WaiterLayoutClient";
import { getUserProfile } from "@/services/userService";

export default async function WaiterLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Strict Role Check: Only 'waiter'
  const profile = await getUserProfile(supabase, user?.id);

  if (!profile || profile.role !== "waiter") {
    if (profile?.role === "owner") {
        redirect("/admin/dashboard");
    }
    redirect("/login");
  }

  return <WaiterLayoutClient>{children}</WaiterLayoutClient>;
}
