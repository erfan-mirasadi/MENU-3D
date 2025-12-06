import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

// --- تنظیمات دستی زبان ---
const CURRENT_LANG = "tr";

async function getMenuData(slug) {
  console.log("🔍 Fetching menu for slug:", slug);

  try {
    // 1. دریافت رستوران
    const { data: restaurant, error: rError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    console.log("📊 Restaurant data:", restaurant);
    console.log("❌ Restaurant error:", rError);

    if (rError) {
      console.error("Restaurant DB Error:", rError);
      return { error: rError, step: "Fetching Restaurant" };
    }

    if (!restaurant) {
      console.error("Restaurant not found in DB");
      return {
        error: { message: "Restaurant is null (Slug not found)" },
        step: "Check Slug",
      };
    }

    // 2. دریافت دسته‌بندی‌ها
    const { data: categories, error: cError } = await supabase
      .from("categories")
      .select(`*, products (*)`)
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true });

    console.log("📋 Categories data:", categories);
    console.log("❌ Categories error:", cError);

    if (cError) {
      console.error("Categories DB Error:", cError);
      return { error: cError, step: "Fetching Categories" };
    }

    return { restaurant, categories, error: null };
  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return { error: err, step: "Unexpected Error" };
  }
}

export default async function MenuPage({ params }) {
  const { slug, table_id } = await params;
  const data = await getMenuData(slug);

  console.log("✅ Final data before render:", {
    hasError: !!data?.error,
    hasRestaurant: !!data?.restaurant,
    categoriesCount: data?.categories?.length,
  });

  // --- بخش دیباگ: اگر ارور داشتیم، قرمز نشون بده ---
  if (data?.error) {
    return (
      <div className="p-10 bg-red-50 text-red-800 font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4">🚨 Error Detected</h1>
        <p>
          <strong>Step:</strong> {data.step}
        </p>
        <pre className="bg-red-100 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(data.error, null, 2)}
        </pre>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded">
          <strong>Tip:</strong> If error code is 42501, run the "Grant Usage"
          SQL again.
        </div>
      </div>
    );
  }

  // اگر دیتا کلا نال بود
  if (!data || !data.restaurant) {
    return notFound();
  }

  const { restaurant, categories } = data;

  console.log("🎨 About to render with:", {
    restaurantName: restaurant.name,
    categoriesCount: categories?.length,
    firstCategory: categories?.[0],
    firstCategoryProducts: categories?.[0]?.products,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* هدر */}
      <div
        className="p-6 text-white shadow-lg sticky top-0 z-10"
        style={{
          backgroundColor: restaurant.theme_config?.primaryColor || "#ea580c",
        }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
            Masa: {table_id}
          </span>
        </div>
      </div>

      {/* لیست غذاها */}
      <div className="p-4 space-y-8">
        {categories?.map((cat) => (
          <div key={cat.id}>
            <h2 className="text-xl font-extrabold text-gray-800 mb-4 sticky top-[80px] bg-gray-50 py-2">
              {/* هندل کردن تایتل اگر آبجکت باشه یا استرینگ */}
              {typeof cat.title === "object"
                ? cat.title[CURRENT_LANG] || cat.title["en"]
                : cat.title}
            </h2>

            <div className="grid gap-4">
              {cat.products?.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3"
                >
                  {/* عکس */}
                  <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* متن */}
                  <div className="flex-1">
                    <h3 className="font-bold">
                      {typeof product.title === "object"
                        ? product.title[CURRENT_LANG] || product.title["en"]
                        : product.title}
                    </h3>
                    <div className="mt-2 font-black text-lg">
                      {Number(product.price).toLocaleString("tr-TR")} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
