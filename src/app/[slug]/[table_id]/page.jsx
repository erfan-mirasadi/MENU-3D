import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper.jsx";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { getRestaurantBySlug } from "@/services/restaurantService";
import { LanguageProvider } from "@/context/LanguageContext.jsx";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const restaurant = await getRestaurantBySlug(decodedSlug);

  if (!restaurant) {
    return {
      title: "Menu 3D",
    };
  }

  let themeColor = "#000000";
  switch (restaurant.template_style) {
    case "modern": themeColor = "#1F1D2B"; break;
    case "classic": themeColor = "#FDFBF7"; break;
    case "minimal": themeColor = "#FFFFFF"; break;
    case "immersive": themeColor = "#0f0f0f"; break;
    case "three-d": themeColor = "#000000"; break;
  }

  return {
    title: `${restaurant.name} | Menu 3D`,
    description: `${restaurant.name} menu`,
    themeColor: themeColor,
  };
}

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
      (product) => product.category_id === category.id,
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
