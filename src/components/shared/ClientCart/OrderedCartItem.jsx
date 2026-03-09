import Image from "next/image";

export default function OrderedCartItem({ item, content }) {
  return (
    <div className="flex items-center gap-4 p-2 rounded-xl">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 grayscale bg-dark-900 flex items-center justify-center">
        {item.product?.image_url ? (
          <Image
            src={item.product?.image_url}
            alt={content(item.product?.title) || "Product image"}
            fill
            sizes="50px"
            className="object-cover"
          />
        ) : (
          <span className="text-white/20 text-[8px] uppercase tracking-wider font-bold">
            No Img
          </span>
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-gray-300 font-medium text-xs truncate">
          {content(item.product?.title)}
        </h4>
      </div>
      <span className="text-gray-500 text-xs font-mono">x{item.quantity}</span>
    </div>
  );
}
