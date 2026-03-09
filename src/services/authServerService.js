import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getUserProfile } from "@/services/userService";

export async function getServerAuthContext() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null };
  }

  const profile = await getUserProfile(supabase, user.id);
  return { user, profile };
}
