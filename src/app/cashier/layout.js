import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/services/userService";
import CashierLayoutClient from "./CashierLayoutClient";

export default async function CashierLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Strict Role Check: Only 'cashier'
  const profile = await getUserProfile(supabase, user?.id);

  if (!profile || profile.role !== "cashier") {
    if (profile?.role === "cashier") {
        redirect("/cashier/dashboard");
    }
    redirect("/login");
  }

  return <CashierLayoutClient>{children}</CashierLayoutClient>;
}
