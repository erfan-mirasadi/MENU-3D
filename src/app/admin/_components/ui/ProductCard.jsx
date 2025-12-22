import SmartMedia from "@/components/ui/SmartMedia";

export default function ProductCard({ product }) {
  const title = product.title?.en || "Product Name";
  const mediaFiles = {
    image_url: product.image_url || "/placeholder-food.png",
    animation_url_ios: product.animation_url_ios || null, // فرمت .mov یا hevc
    animation_url_android: product.animation_url_android || null, // فرمت .webm
  };

  return (
    <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative mt-8 border border-gray-800 hover:border-primary/50 transition-colors h-full">
      <div className="absolute -top-10 w-28 h-28 rounded-full border-4 border-dark-800 shadow-md overflow-hidden bg-gray-800 z-10">
        <SmartMedia
          files={mediaFiles}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-16 w-full flex flex-col flex-1">
        <h3 className="text-white font-medium text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        <p className="text-text-dim text-sm mb-4">
          {product.price} ₺ • <span className="text-gray-500">20 Bowls</span>
        </p>
      </div>

      <button className="mt-auto w-full py-2 rounded-lg bg-gray-700/30 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit dish
      </button>
    </div>
  );
}
