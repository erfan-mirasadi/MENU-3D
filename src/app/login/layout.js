import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/services/userService";

export default async function LoginLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getUserProfile(supabase, user.id);

    // Non-owner roles: redirect to their dashboard
    // Owners: let them stay on login page to pick a role tab
    if (profile?.role === "waiter") {
      redirect("/waiter/dashboard");
    } else if (profile?.role === "chef") {
      redirect("/chef/dashboard");
    } else if (profile?.role === "cashier") {
      redirect("/cashier/dashboard");
    }
  }

  return <>{children}</>;
}
