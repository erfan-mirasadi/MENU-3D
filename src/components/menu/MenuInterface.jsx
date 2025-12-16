"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

export default function MenuInterface({ restaurant, categories, tableId }) {
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const getTitle = (obj) => {
    if (!obj) return "";
    return typeof obj === "object"
      ? obj["en"] || obj["tr"] || Object.values(obj)[0]
      : obj;
  };

  return (
    <div className="min-h-screen bg-[#1F1D2B] font-sans pb-24 text-gray-100 selection:bg-[#ea7c69] selection:text-white overflow-x-hidden">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-20 border-b border-white/5 shadow-2xl transition-all bg-[#1F1D2B]">
        {/* Background Overlay */}
        {restaurant.bg_image ? (
          <div className="absolute inset-0 z-0">
            <img
              src={restaurant.bg_image}
              alt="header-bg"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#1F1D2B]/95 to-[#1F1D2B]" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-[#1F1D2B]/95 backdrop-blur-md" />
        )}

        <div className="relative z-10 p-6 pb-0">
          <div className="flex justify-between items-start mb-6">
            {/* LOGO & INFO */}
            <div className="flex items-center gap-3">
              {restaurant.logo ? (
                <div className="w-12 h-12 rounded-2xl border border-white/10 p-0.5 bg-[#252836] shadow-lg">
                  <img
                    src={restaurant.logo}
                    alt="logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#252836] border border-white/10 flex items-center justify-center text-lg font-bold text-[#ea7c69]">
                  {restaurant.name.charAt(0)}
                </div>
              )}

              <div>
                <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md leading-tight">
                  {restaurant.name}
                </h1>
                <p className="text-gray-400 text-[10px] mt-0.5 font-mono uppercase tracking-widest opacity-80">
                  Masa: {tableId}
                </p>
              </div>
            </div>

            {/* STATUS BADGE */}
            <div className="bg-[#252836]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                  Open
                </span>
              </div>
            </div>
          </div>

          {/* --- CATEGORIES PILLS --- */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 min-h-[70px]">
            {categories?.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative h-[50px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex-shrink-0 group ${
                    isActive
                      ? "w-[160px] shadow-[0_0_20px_-5px_#ea7c69]"
                      : "w-[50px] bg-[#252836] border border-white/10 hover:bg-[#2d303e]"
                  }`}
                >
                  {isActive && cat.image_url && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={cat.image_url}
                        className="w-full h-full object-cover brightness-50"
                        alt="bg"
                      />
                      <div className="absolute inset-0 bg-[#ea7c69]/40 mix-blend-overlay"></div>
                    </div>
                  )}
                  <div
                    className={`absolute z-10 transition-all duration-300 ${
                      isActive ? "opacity-0 scale-50" : "opacity-100 scale-100"
                    }`}
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        className="w-6 h-6 object-contain grayscale opacity-70 group-hover:grayscale-0"
                      />
                    ) : (
                      <span className="text-lg">🍔</span>
                    )}
                  </div>
                  <div
                    className={`absolute z-10 flex items-center gap-2 px-4 transition-all duration-500 delay-100 ${
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                  >
                    <span className="text-sm font-bold text-white drop-shadow-md whitespace-nowrap">
                      {getTitle(cat.title)}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      {cat.products?.length}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full z-20"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="p-4 pt-2 min-h-[60vh]">
        {categories?.map((cat) => (
          <div
            key={cat.id}
            className={`${
              activeCategory === cat.id ? "block" : "hidden"
            } animate-in fade-in zoom-in-95 duration-500`}
          >
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                Menu
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {cat.products?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- CART BAR --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-30">
        <button className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(234,124,105,0.5)] flex items-center justify-between px-6 active:scale-95 transition-all border border-white/20 backdrop-blur-xl">
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
              Total
            </span>
            <span className="text-lg font-black">0 ₺</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">View Cart</span>
            <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">
              0
            </div>
          </div>
        </button>
      </div>

      {/* --- MODAL (AR READY) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          ></div>
          <div className="bg-[#252836] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative z-10 border-t border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="h-80 relative group bg-[#1a1c25] w-full">
              {selectedProduct.model_url ? (
                <div className="w-full h-full">
                  {/* === MODEL VIEWER SETTINGS === */}
                  <model-viewer
                    // 1. DATA SOURCE
                    src={
                      selectedProduct.model_url ||
                      selectedProduct.model_lowpoly_url
                    }
                    // نکته مهم: اگر فایل usdz داشتی اینجا بذار، اگر نه خالی بذار تا خودش بسازه
                    ios-src={selectedProduct.model_url}
                    poster={selectedProduct.image_url}
                    alt={getTitle(selectedProduct.title)}
                    // 2. AR MODES (ترتیب حیاتی برای رفع کرش iOS)
                    ar
                    // اولویت اول: scene-viewer (اندروید)، دوم: quick-look (آیفون)
                    ar-modes="scene-viewer quick-look webxr"
                    // این خط به سافاری میگه با انجین خودش باز کنه نه وب
                    quick-look-browsers="safari chrome"
                    // 3. SCALE MANAGEMENT (درخواست خودت)
                    // این باعث میشه مدل با ۵۰ درصد سایز اصلی لود بشه تا راحت روی میز جا بشه
                    scale="0.5 0.5 0.5"
                    ar-scale="auto" // اجازه میده کاربر بعدا زوم کنه (fixed نذار)
                    ar-placement="floor" // تاکید روی سطح افقی
                    // 4. PERFORMANCE & CAMERA
                    loading="eager"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    shadow-softness="0.6"
                    touch-action="pan-y"
                    // 5. STYLE
                    style={{ width: "100%", height: "100%", outline: "none" }}
                  >
                    {/* --- AR BUTTON --- */}
                    <button
                      slot="ar-button"
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black h-12 px-6 rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center gap-2 active:scale-90 transition-all z-50 border border-white/40 backdrop-blur-md"
                    >
                      <div className="w-5 h-5 relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-full h-full text-[#ea7c69]"
                        >
                          <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      </div>
                      <span className="text-sm font-bold tracking-wide">
                        View in Room
                      </span>
                    </button>

                    {/* --- LOADING BAR --- */}
                    <div
                      slot="progress-bar"
                      className="absolute top-0 left-0 w-full h-1 bg-white/10"
                    >
                      <div className="h-full bg-[#ea7c69] origin-left animate-[progress_1.5s_ease-in-out_infinite] w-full scale-x-0"></div>
                    </div>
                  </model-viewer>
                </div>
              ) : (
                <img
                  src={selectedProduct.image_url}
                  className="w-full h-full object-cover"
                />
              )}
              {/* گرادینت پایین برای خوانایی */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#252836] via-transparent to-transparent pointer-events-none"></div>

              {/* دکمه بستن */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 bg-black/40 text-white w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-[#ea7c69] transition-colors border border-white/10 z-50 shadow-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-8 -mt-12 relative pointer-events-none">
              {/* پنل اطلاعات (Pointer events auto میکنیم که دکمه ها کار کنن) */}
              <div className="pointer-events-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white text-3xl font-black leading-tight w-3/4">
                    {getTitle(selectedProduct.title)}
                  </h3>
                  <div className="bg-[#ea7c69] px-3 py-1.5 rounded-xl shadow-lg shadow-orange-900/30">
                    <p className="text-white font-bold text-lg">
                      {Number(selectedProduct.price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-10 leading-relaxed font-light">
                  {getTitle(selectedProduct.description)}
                </p>
                <button className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-orange-900/40 active:scale-95 transition-transform flex items-center justify-center gap-3">
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
