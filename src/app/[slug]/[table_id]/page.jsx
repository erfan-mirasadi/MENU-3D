import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper.jsx";
import { supabase } from "@/lib/supabase.js";

async function getMenuData(slug, tableId) {
  // 1. گرفتن رستوران
  const { data: restaurant, error: rError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (rError || !restaurant) return null;

  // 2. گرفتن تمام کتگوری‌ها (برای منوی اصلی)
  const { data: categories } = await supabase
    .from("categories")
    .select(`*, products(*)`)
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  // 3. گرفتن محصولات پیشنهادی (اولین 5 تا محصول)
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .limit(5);

  console.log("🎯 Server fetched featuredProducts:", featuredProducts);

  return { restaurant, categories, featuredProducts: featuredProducts || [] };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { slug, table_id } = resolvedParams;
  const decodedSlug = decodeURIComponent(slug);
  const decodedTableId = decodeURIComponent(table_id);

  const data = await getMenuData(decodedSlug, decodedTableId);

  if (!data) return notFound();

  return (
    <ClientWrapper
      restaurant={data.restaurant}
      categories={data.categories || []}
      tableId={decodedTableId}
      featuredProducts={data.featuredProducts || []}
    />
  );
}
