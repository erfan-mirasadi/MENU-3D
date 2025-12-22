import { supabase } from "@/lib/supabase";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import ProductsView from "../_components/ui/ProductsView";

export default async function DashboardPage() {
  //development only *********
  const TEST_USER_ID = "795d61c8-a279-4716-830c-b5919180a75f";

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("owner_id", TEST_USER_ID)
    .single();

  if (!restaurant) {
    return (
      <div className="p-10 text-red-500">
        No restaurant found for this user.
      </div>
    );
  }

  const [categories, products] = await Promise.all([
    getCategories(restaurant.id),
    getProducts(restaurant.id),
  ]);

  return (
    <div className="flex flex-col h-full bg-dark-900 text-white overflow-hidden">
      {/* header */}
      <div className="pt-8 px-4 sm:px-8 flex justify-between items-center bg-dark-900 z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Products Management
          </h1>
          <p className="text-text-dim text-sm mt-1">{restaurant.name}</p>
        </div>

        <button className="hidden sm:flex items-center gap-2 border border-gray-600 rounded-lg px-4 py-2 text-sm text-text-light hover:bg-dark-800 transition">
          Manage Categories
        </button>
      </div>
      <ProductsView categories={categories} products={products} />
    </div>
  );
}
