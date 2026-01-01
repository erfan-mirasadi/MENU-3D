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

    if (profile?.role === "owner") {
      redirect("/admin/dashboard");
    } else if (profile?.role === "waiter") {
      redirect("/waiter/dashboard");
    }
  }

  return <>{children}</>;
}
