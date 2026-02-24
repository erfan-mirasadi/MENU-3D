import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/services/userService";
import CashierLayoutClient from "./CashierLayoutClient";

export const metadata = {
  title: "Menu 3D — Cashier",
  manifest: "/manifests/cashier.json",
  icons: {
    icon: "/cashier-icon.jpeg",
    apple: "/cashier-icon.jpeg",
  },
};

export default async function CashierLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Strict Role Check: Only 'cashier'
  const profile = await getUserProfile(supabase, user?.id);

  if (!profile || (profile.role !== "cashier" && profile.role !== "owner")) {
    redirect("/login");
  }

  return <CashierLayoutClient>{children}</CashierLayoutClient>;
}
