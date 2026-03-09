import { notFound } from "next/navigation";
import ClientWrapper from "./[table_id]/ClientWrapper.jsx";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { getRestaurantBySlug } from "@/services/restaurantService";
import { LanguageProvider } from "@/context/LanguageContext.jsx";
import LandingClient from "@/components/landing/LandingClient";

const LANDING_LANGS = new Set(["en", "tr", "fa", "ar", "de", "ru"]);

const LANG_META = {
  en: {
    title: "Menu 3D — Interactive 3D Digital Menu for Restaurants",
    description:
      "Transform your restaurant with an immersive 3D menu, integrated POS, and real-time kitchen syncing.",
  },
  tr: {
    title: "Menu 3D — Restoranlar için 3D Dijital Menü",
    description:
      "Restoranınızı etkileşimli 3D menü, entegre POS ve eşzamanlı mutfak senkronizasyonu ile dönüştürün.",
  },
  fa: {
    title: "Menu 3D — منوی دیجیتال سه بعدی برای رستوران‌ها",
    description:
      "رستوران خود را با منوی تعاملی سه بعدی، سیستم فروش یکپارچه و همگام‌سازی لحظه‌ای آشپزخانه متحول کنید.",
  },
  ar: {
    title: "Menu 3D — قائمة رقمية ثلاثية الأبعاد للمطاعم",
    description:
      "قم بتحويل مطعمك باستخدام قائمة ثلاثية الأبعاد تفاعلية ونظام نقاط بيع مدمج ومزامنة فورية للمطبخ.",
  },
  de: {
    title: "Menu 3D — Interaktives 3D-Digitalmenü für Restaurants",
    description:
      "Verwandeln Sie Ihr Restaurant mit einem interaktiven 3D-Menü, integriertem POS und Echtzeit-Küchensynchronisierung.",
  },
  ru: {
    title: "Menu 3D — Интерактивное 3D-меню для ресторанов",
    description:
      "Преобразите свой ресторан с помощью интерактивного 3D-меню, интегрированной POS-системы и синхронизации с кухней.",
  },
};

function buildLandingAlternates(currentLang) {
  const languages = {};
  for (const code of LANDING_LANGS) {
    languages[code] = `https://menu-3d.com/${code}`;
  }
  languages["x-default"] = "https://menu-3d.com/en";
  return { canonical: `https://menu-3d.com/${currentLang}`, languages };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);

  if (LANDING_LANGS.has(decodedSlug)) {
    const meta = LANG_META[decodedSlug] || LANG_META.en;
    return {
      title: meta.title,
      description: meta.description,
      alternates: buildLandingAlternates(decodedSlug),
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: `https://menu-3d.com/${decodedSlug}`,
        siteName: "Menu 3D",
        images: [
          { url: "/logo-web.png", width: 800, height: 600, alt: "Menu 3D" },
        ],
        locale:
          decodedSlug === "fa"
            ? "fa_IR"
            : decodedSlug === "ar"
              ? "ar_SA"
              : decodedSlug === "tr"
                ? "tr_TR"
                : decodedSlug === "de"
                  ? "de_DE"
                  : decodedSlug === "ru"
                    ? "ru_RU"
                    : "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        images: ["/logo-web.png"],
      },
    };
  }

  const restaurant = await getRestaurantBySlug(decodedSlug);

  if (!restaurant) {
    return {
      title: "Menu 3D",
    };
  }

  let themeColor = "#000000";
  switch (restaurant.template_style) {
    case "modern":
      themeColor = "#1F1D2B";
      break;
    case "classic":
      themeColor = "#FDFBF7";
      break;
    case "minimal":
      themeColor = "#FFFFFF";
      break;
    case "immersive":
      themeColor = "#0f0f0f";
      break;
    case "three-d":
      themeColor = "#000000";
      break;
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
  const { slug } = resolvedParams;
  const decodedSlug = decodeURIComponent(slug);

  if (LANDING_LANGS.has(decodedSlug)) {
    return <LandingClient lang={decodedSlug} />;
  }

  const data = await getMenuData(decodedSlug);

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
        tableId={null}
        featuredProducts={data.featuredProducts}
        isGuestMode={true}
      />
    </LanguageProvider>
  );
}
