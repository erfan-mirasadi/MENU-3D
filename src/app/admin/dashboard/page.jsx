import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import ProductsView from "@/app/admin/_components/ui/ProductsView";
import { redirect } from "next/navigation";
import Image from "next/image";

// Ensure page is always fresh (no cache)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, supported_languages, logo")
    .eq("owner_id", user.id)
    .single();

  if (authError || !user) {
    redirect("/admin/login");
  }

  if (restaurantError || !restaurant) {
    redirect("/admin/onboarding");
  }

  const [categories, products] = await Promise.all([
    getCategories(restaurant.id),
    getProducts(restaurant.id),
  ]);

  return (
    <div className="flex flex-col h-full bg-dark-900 text-white overflow-hidden">
      {/* Header */}
      <div className="pt-2 px-4 sm:px-4 flex justify-between items-center bg-dark-900 z-10 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Menu Management
          </h1>
          <p className="text-text-dim text-sm mt-1">{restaurant.name}</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 border border-gray-600 rounded-lg px-4 py-2 text-sm text-text-light hover:bg-dark-800 transition">
            Manage Categories
          </button>
          {restaurant.logo && (
            <Image
              src={restaurant.logo}
              alt="Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover opacity-60"
            />
          )}
        </div>
      </div>

      <ProductsView
        categories={categories}
        products={products}
        restaurantId={restaurant.id}
        supportedLanguages={restaurant.supported_languages}
      />
    </div>
  );
}
