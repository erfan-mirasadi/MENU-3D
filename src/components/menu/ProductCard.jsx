"use client";
export default function ProductCard({ product, onClick }) {
  // تابع کمکی برای ترجمه (چون هنوز store کامل نیست دستی هندل میکنیم)
  const getTitle = (obj) => {
    if (!obj) return "";
    return typeof obj === "object" ? obj["tr"] || obj["en"] : obj;
  };

  return (
    <div
      onClick={onClick}
      className="group relative mt-12 bg-[#252836] rounded-2xl p-4 pt-16 cursor-pointer hover:bg-[#2d303e] transition-colors border border-white/5"
    >
      {/* image section */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-4 border-[#1F1D2B] bg-gray-800 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={getTitle(product.title)}
            className="w-full h-full object-cover"
            width={112}
            height={112}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            No Image
          </div>
        )}

        {/* 3d badge */}
        {product.model_url && (
          <div className="absolute bottom-2 right-1/2 translate-x-1/2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
            <span className="text-[9px] font-bold text-white tracking-widest">
              3D
            </span>
            <div className="w-1.5 h-1.5 bg-[#ea7c69] rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* --- محتوای کارت --- */}
      <div className="text-center flex flex-col h-full items-center">
        {/* عنوان */}
        <h3 className="text-white font-medium text-lg leading-tight line-clamp-2 w-full mb-1">
          {getTitle(product.title)}
        </h3>

        {/* توضیحات کوتاه */}
        <p className="text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed">
          {getTitle(product.description)}
        </p>

        {/* بخش قیمت و موجودی (پایین چسبیده) */}
        <div className="mt-auto w-full">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-gray-500 text-xs">
              {product.original_price ? "Tachfif" : "Available"}
            </span>
          </div>

          {/* کادر قیمت (طبق خواسته شما) */}
          <div className="flex items-center justify-between bg-[#1F1D2B] rounded-lg p-1 pr-1 border border-white/5">
            <div className="pl-3 font-bold text-white text-sm">
              {Number(product.price).toLocaleString("tr-TR")} ₺
            </div>

            {/* دکمه ادد */}
            <button className="bg-[#ea7c69] hover:bg-[#d96c5a] text-white w-8 h-8 rounded-md flex items-center justify-center shadow-lg shadow-orange-900/20 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
