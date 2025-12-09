import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper";
import { supabase } from "@/lib/supabase";

async function getMenuData(slug, tableId) {
  console.log("🔍 Fetching for:", slug, tableId);
  const { data: restaurant, error: rError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (rError || !restaurant) {
    console.error("❌ Restaurant Error:", rError);
    return null;
  }
  const { data: categories, error: cError } = await supabase
    .from("categories")
    .select(
      `
      *,
      products (
        *
      )
    `
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  if (cError) {
    console.error("❌ Categories Error:", cError);
  }

  return { restaurant, categories };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { slug, table_id } = resolvedParams;

  if (!slug || !table_id) {
    console.error("❌ URL Params are missing! Check folder structure.");
    return notFound();
  }

  const decodedSlug = decodeURIComponent(slug);
  const decodedTableId = decodeURIComponent(table_id);

  const data = await getMenuData(decodedSlug, decodedTableId);
  if (!data) return notFound();

  return (
    <ClientWrapper
      restaurant={data.restaurant}
      categories={data.categories || []}
      tableId={decodedTableId}
    />
  );
}
