import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AdminLayoutClient from "./AdminLayoutClient"; // فایل جدید رو ایمپورت کن

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let restaurant = null;
  if (user) {
    const { data } = await supabase
      .from("restaurants")
      .select("name, image_url")
      .eq("owner_id", user.id)
      .single();
    restaurant = data;
  }

  return (
    <AdminLayoutClient user={user} restaurant={restaurant}>
      {children}
    </AdminLayoutClient>
  );
}
