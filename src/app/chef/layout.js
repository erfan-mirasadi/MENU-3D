import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/services/userService";
import ChefLayoutClient from "./ChefLayoutClient";

export const metadata = {
  title: "Menu 3D — Chef",
  applicationName: "Kitchen",
  manifest: "/manifests/chef.json",
  appleWebApp: {
    capable: true,
    title: "Kitchen",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/chef-icon.jpeg",
    apple: "/chef-icon.jpeg",
  },
};

export const viewport = {
  themeColor: "#1f1d2b",
};

export default async function chefLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Strict Role Check: Only 'chef'
  const profile = await getUserProfile(supabase, user?.id);

  if (!profile || (profile.role !== "chef" && profile.role !== "owner")) {
    redirect("/login");
  }

  return <ChefLayoutClient>{children}</ChefLayoutClient>;
}
