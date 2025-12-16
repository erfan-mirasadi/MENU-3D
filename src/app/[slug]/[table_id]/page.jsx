import { notFound } from "next/navigation";
import ClientWrapper from "./ClientWrapper.jsx";
import { supabase } from "@/lib/supabase.js";

async function getMenuData(slug, tableId) {
  console.log("🔍 Fetching data for:", { slug, tableId });
  console.log("📡 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { data: restaurant, error: rError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  console.log("🏪 Restaurant:", restaurant);

  if (rError || !restaurant) {
    return {
      error: rError || new Error("Restaurant not found"),
      restaurant: null,
    };
  }
  const { data: categories } = await supabase
    .from("categories")
    .select(`*, products(*)`)
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .limit(5);

  console.log("🎯 Server fetched featuredProducts:", featuredProducts);

  return {
    restaurant,
    categories,
    featuredProducts: featuredProducts || [],
    error: null,
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const { slug, table_id } = resolvedParams;
  const decodedSlug = decodeURIComponent(slug);
  const decodedTableId = decodeURIComponent(table_id);
  const data = await getMenuData(decodedSlug, decodedTableId);
  if (data?.error) {
    return (
      <div className="min-h-screen bg-red-900 text-white p-8 font-mono">
        <h1 className="text-3xl mb-4">❌ Error Loading Menu</h1>
        <div className="bg-red-950 p-4 rounded mb-4">
          <p className="mb-2">
            <strong>Slug:</strong> {decodedSlug}
          </p>
          <p className="mb-2">
            <strong>Table ID:</strong> {decodedTableId}
          </p>
          <p className="mb-2">
            <strong>Supabase URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET"}
          </p>
        </div>
        <pre className="bg-black p-4 rounded overflow-auto">
          {JSON.stringify(data.error, null, 2)}
        </pre>
      </div>
    );
  }

  if (!data || !data.restaurant) return notFound();

  return (
    <ClientWrapper
      restaurant={data.restaurant}
      categories={data.categories || []}
      tableId={decodedTableId}
      featuredProducts={data.featuredProducts || []}
    />
  );
}
