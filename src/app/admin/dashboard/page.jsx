import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import {
  getRestaurantByOwnerId,
  getRestaurantById,
} from "@/services/restaurantService";
import { getServerAuthContext } from "@/services/authServerService";
import ProductsView from "@/app/admin/_components/ui/ProductsView";
import { redirect } from "next/navigation";
import Image from "next/image";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await getServerAuthContext();

  if (!user) {
    redirect("/login");
  }

  let restaurant = null;
  if (user) {
    restaurant = await getRestaurantByOwnerId(user.id);

    if (!restaurant) {
      if (profile?.restaurant_id) {
        restaurant = await getRestaurantById(profile.restaurant_id);
      }
    }
  }

  if (!restaurant) {
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
        restaurantSlug={restaurant.slug}
      />
    </div>
  );
}
