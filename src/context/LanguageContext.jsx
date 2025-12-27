"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const ALL_LANGUAGES = [
  { code: "en", name: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "tr", name: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "ru", name: "Русский", dir: "ltr", flag: "🇷🇺" },
  { code: "fa", name: "فارسی", dir: "rtl", flag: "🇮🇷" },
  { code: "ar", name: "العربية", dir: "rtl", flag: "🇸🇦" },
  { code: "de", name: "Deutsch", dir: "ltr", flag: "🇩🇪" },
];

const DICTIONARY = {
  en: {
    addToCart: "Add to Cart",
    addToOrder: "Add to Order",
    total: "Total",
    viewCart: "View Cart",
    empty: "No items found",
    currency: "₺",
    offers: "Offers",
    yourOrder: "Your Order",
    table: "Table",
    active: "Active",
    emptyCart: "Your cart is empty",
    newItems: "New Items (Not Sent)",
    remove: "Remove",
    sentToKitchen: "Sent to Kitchen",
    totalAmount: "Total Amount",
    confirmOrder: "Confirm Order",
    items: "Items",
    noNewItems: "No new items to order",
    showOnTable: "Show on Table",
    "3d": "3D",
    viewInAR: "View in AR",
    close: "Close",
    yourSelection: "Your Selection",
    readyToOrder: "Ready to Order",
    kitchenPreparing: "Kitchen Preparing",
    grandTotal: "Grand Total",
    yourBag: "Your Bag",
    emptyBag: "Empty Bag",
    qty: "Qty",
    checkout: "Checkout",
    exploreMenu: "Explore Menu",
    fineDining: "Fine Dining Experience",
    viewMenu: "View Menu",
    viewFullMenu: "View Full Menu",
    totalOrder: "Total Order",
    open: "Open",
    enterMenu: "Enter Menu",
  },
  tr: {
    addToCart: "Sepete Ekle",
    addToOrder: "Siparişe Ekle",
    total: "Toplam",
    viewCart: "Sepeti Gör",
    empty: "Ürün bulunamadı",
    currency: "₺",
    offers: "Fırsatlar",
    yourOrder: "Siparişiniz",
    table: "Masa",
    active: "Aktif",
    emptyCart: "Sepetiniz boş",
    newItems: "Yeni Ürünler (Gönderilmedi)",
    remove: "Kaldır",
    sentToKitchen: "Mutfağa Gönderildi",
    totalAmount: "Toplam Tutar",
    confirmOrder: "Siparişi Onayla",
    items: "Ürün",
    noNewItems: "Yeni sipariş yok",
    showOnTable: "Masada Göster",
    "3d": "3D",
    viewInAR: "AR'da Görüntüle",
    close: "Kapat",
    yourSelection: "Seçimleriniz",
    readyToOrder: "Sipariş İçin Hazır",
    kitchenPreparing: "Mutfak Hazırlıyor",
    grandTotal: "Genel Toplam",
    yourBag: "Sepetiniz",
    emptyBag: "Boş Sepet",
    qty: "Adet",
    checkout: "Ödeme",
    exploreMenu: "Menüyü Keşfet",
    fineDining: "Özel Yemek Deneyimi",
    viewMenu: "Menüyü Gör",
    viewFullMenu: "Tüm Menüyü Gör",
    totalOrder: "Toplam Sipariş",
    open: "Açık",
    enterMenu: "Menüye Gir",
  },
  ru: {
    addToCart: "В корзину",
    addToOrder: "Добавить в заказ",
    total: "Итого",
    viewCart: "Корзина",
    empty: "Нет товаров",
    currency: "₺",
    offers: "Специальные",
    yourOrder: "Ваш заказ",
    table: "Стол",
    active: "Активен",
    emptyCart: "Корзина пуста",
    newItems: "Новые товары (Не отправлено)",
    remove: "Удалить",
    sentToKitchen: "Отправлено на кухню",
    totalAmount: "Общая сумма",
    confirmOrder: "Подтвердить заказ",
    items: "Товары",
    noNewItems: "Нет новых товаров",
    showOnTable: "Показать на столе",
    "3d": "3D",
    viewInAR: "Просмотр в AR",
    close: "Закрыть",
    yourSelection: "Ваш выбор",
    readyToOrder: "Готово к заказу",
    kitchenPreparing: "Кухня готовит",
    grandTotal: "Итого",
    yourBag: "Ваша корзина",
    emptyBag: "Пустая корзина",
    qty: "Кол-во",
    checkout: "Оформить",
    exploreMenu: "Изучить меню",
    fineDining: "Изысканная кухня",
    viewMenu: "Посмотреть меню",
    viewFullMenu: "Полное меню",
    totalOrder: "Общий заказ",
    open: "Открыто",
    enterMenu: "Войти в меню",
  },
  fa: {
    addToCart: "افزودن به سبد",
    addToOrder: "افزودن به سفارش",
    total: "جمع کل",
    viewCart: "مشاهده سبد",
    empty: "موردی یافت نشد",
    currency: "لیر",
    offers: "پیشنهادات",
    yourOrder: "سفارش شما",
    table: "میز",
    active: "فعال",
    emptyCart: "سبد خرید خالی است",
    newItems: "موارد جدید (ارسال نشده)",
    remove: "حذف",
    sentToKitchen: "به آشپزخانه ارسال شد",
    totalAmount: "مبلغ کل",
    confirmOrder: "تایید سفارش",
    items: "مورد",
    noNewItems: "مورد جدیدی برای سفارش نیست",
    showOnTable: "نمایش روی میز",
    "3d": "سه‌بعدی",
    viewInAR: "مشاهده در AR",
    close: "بستن",
    yourSelection: "انتخاب‌های شما",
    readyToOrder: "آماده سفارش",
    kitchenPreparing: "آشپزخانه در حال آماده‌سازی",
    grandTotal: "جمع کل",
    yourBag: "کیف شما",
    emptyBag: "کیف خالی",
    qty: "تعداد",
    checkout: "پرداخت",
    exploreMenu: "مشاهده منو",
    fineDining: "تجربه غذای عالی",
    viewMenu: "مشاهده منو",
    viewFullMenu: "مشاهده منوی کامل",
    totalOrder: "کل سفارش",
    open: "باز",
    enterMenu: "ورود به منو",
  },
  ar: {
    addToCart: "أضف للسلة",
    addToOrder: "أضف للطلب",
    total: "المجموع",
    viewCart: "عرض السلة",
    empty: "لا يوجد عناصر",
    currency: "₺",
    offers: "عروض",
    yourOrder: "طلبك",
    table: "طاولة",
    active: "نشط",
    emptyCart: "سلتك فارغة",
    newItems: "عناصر جديدة (لم ترسل)",
    remove: "إزالة",
    sentToKitchen: "أرسل للمطبخ",
    totalAmount: "المبلغ الإجمالي",
    confirmOrder: "تأكيد الطلب",
    items: "عناصر",
    noNewItems: "لا توجد عناصر جديدة",
    showOnTable: "عرض على الطاولة",
    "3d": "ثلاثي الأبعاد",
    viewInAR: "عرض في AR",
    close: "إغلاق",
    yourSelection: "اختيارك",
    readyToOrder: "جاهز للطلب",
    kitchenPreparing: "المطبخ يحضر",
    grandTotal: "الإجمالي الكلي",
    yourBag: "حقيبتك",
    emptyBag: "حقيبة فارغة",
    qty: "الكمية",
    checkout: "الدفع",
    exploreMenu: "استكشف القائمة",
    fineDining: "تجربة طعام راقية",
    viewMenu: "عرض القائمة",
    viewFullMenu: "عرض القائمة الكاملة",
    totalOrder: "إجمالي الطلب",
    open: "مفتوح",
    enterMenu: "ادخل القائمة",
  },
  de: {
    addToCart: "In den Warenkorb",
    addToOrder: "Zur Bestellung",
    total: "Gesamt",
    viewCart: "Warenkorb",
    empty: "Keine Artikel",
    currency: "₺",
    offers: "Angebote",
    yourOrder: "Ihre Bestellung",
    table: "Tisch",
    active: "Aktiv",
    emptyCart: "Ihr Warenkorb ist leer",
    newItems: "Neue Artikel (Nicht gesendet)",
    remove: "Entfernen",
    sentToKitchen: "An Küche gesendet",
    totalAmount: "Gesamtbetrag",
    confirmOrder: "Bestellung bestätigen",
    items: "Artikel",
    noNewItems: "Keine neuen Artikel",
    showOnTable: "Auf Tisch zeigen",
    "3d": "3D",
    viewInAR: "In AR ansehen",
    close: "Schließen",
    yourSelection: "Ihre Auswahl",
    readyToOrder: "Bereit zur Bestellung",
    kitchenPreparing: "Küche bereitet vor",
    grandTotal: "Gesamtsumme",
    yourBag: "Ihre Tasche",
    emptyBag: "Leere Tasche",
    qty: "Menge",
    checkout: "Kasse",
    exploreMenu: "Menü erkunden",
    fineDining: "Gehobene Küche",
    viewMenu: "Menü ansehen",
    viewFullMenu: "Vollständiges Menü",
    totalOrder: "Gesamtbestellung",
    open: "Geöffnet",
    enterMenu: "Menü betreten",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children, dbSettings }) => {
  const supportedCodes = dbSettings?.supported_languages;

  const availableLanguages = ALL_LANGUAGES.filter((lang) =>
    supportedCodes.includes(lang.code)
  );

  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-lang");
      if (saved && supportedCodes.includes(saved)) return saved;
    }
    return dbSettings?.default_language || "tr";
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    localStorage.setItem("app-lang", language);

    const currentLangConfig = ALL_LANGUAGES.find((l) => l.code === language);
    const dir = currentLangConfig?.dir || "ltr";

    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) =>
    DICTIONARY[language]?.[key] || DICTIONARY["tr"][key] || key;

  const content = (data) => {
    if (!data) return "";
    return typeof data === "object"
      ? data[language] ||
          data[dbSettings?.default_language] ||
          data["tr"] ||
          Object.values(data)[0]
      : data;
  };

  if (!isLoaded) return null;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        content,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
