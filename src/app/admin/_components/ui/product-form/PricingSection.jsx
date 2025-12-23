// src/app/admin/_components/ui/product-form/PricingSection.jsx
import { RiMoneyDollarCircleLine, RiPercentLine } from "react-icons/ri";

export default function PricingSection({
  formData,
  setFormData,
  hasDiscount,
  setHasDiscount,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <RiMoneyDollarCircleLine className="text-primary" /> Pricing
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 ml-1">
            Final Price <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3 top-3 text-gray-500">₺</span>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 pl-8 text-white focus:border-primary focus:outline-none font-bold text-lg"
            />
          </div>
        </div>

        {/* Discount Toggle */}
        <div className="flex items-center justify-between bg-dark-800/50 p-3 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <RiPercentLine
              className={`text-xl ${
                hasDiscount ? "text-primary" : "text-gray-500"
              }`}
            />
            <span>Apply Discount?</span>
          </div>
          <button
            type="button"
            onClick={() => setHasDiscount(!hasDiscount)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              hasDiscount ? "bg-primary" : "bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                hasDiscount ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Original Price Input */}
        {hasDiscount && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <label className="block text-xs text-primary mb-1 ml-1 font-bold">
              Original Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-primary/50 line-through">
                ₺
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={(e) =>
                  setFormData({ ...formData, original_price: e.target.value })
                }
                className="w-full bg-dark-900 border border-primary/30 rounded-xl p-3 pl-8 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Availability Toggle */}
      <div
        className="flex items-center gap-3 bg-dark-800 p-3 rounded-xl border border-gray-700 cursor-pointer select-none"
        onClick={() =>
          setFormData((p) => ({ ...p, is_available: !p.is_available }))
        }
      >
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            formData.is_available
              ? "bg-green-500 border-green-500"
              : "border-gray-500"
          }`}
        >
          {formData.is_available && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>
        <span className="text-sm text-gray-300">Available in Menu</span>
      </div>
    </div>
  );
}
