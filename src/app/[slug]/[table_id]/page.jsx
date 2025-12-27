import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper.jsx";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { getRestaurantBySlug } from "@/services/restaurantService";
import { LanguageProvider } from "@/context/LanguageContext.jsx";

// // این فانکشن رو کش (Cache) نمیکنیم تا تغییرات دیتابیس رو سریع ببینی
// export const dynamic = "force-dynamic";

async function getMenuData(slug) {
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return { error: "Restaurant not found" };
  }

  const [categories, allProducts] = await Promise.all([
    getCategories(restaurant.id),
    getProducts(restaurant.id),
  ]);

  const categoriesWithProducts = categories.map((category) => ({
    ...category,
    products: allProducts.filter(
      (product) => product.category_id === category.id
    ),
  }));

  const featuredProducts = allProducts.slice(0, 5);

  return {
    restaurant,
    categories: categoriesWithProducts,
    featuredProducts,
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { slug, table_id } = resolvedParams;

  const decodedSlug = decodeURIComponent(slug);
  const decodedTableId = decodeURIComponent(table_id);
  const data = await getMenuData(decodedSlug, decodedTableId);

  if (data.error) {
    return notFound();
  }

  return (
    <LanguageProvider
      dbSettings={{
        supported_languages: data.restaurant.supported_languages,
        default_language: data.restaurant.default_language,
      }}
    >
      <ClientWrapper
        restaurant={data.restaurant}
        categories={data.categories}
        tableId={decodedTableId}
        featuredProducts={data.featuredProducts}
      />
    </LanguageProvider>
  );
}
