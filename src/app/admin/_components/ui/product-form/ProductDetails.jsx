// src/app/admin/_components/ui/product-form/ProductDetails.jsx
export default function ProductDetails({ activeLang, formData, onLangChange }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300" key={activeLang}>
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Details for{" "}
          <span className="text-primary">{activeLang.toUpperCase()}</span>
        </h3>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">
          Product Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title[activeLang] || ""}
          onChange={(e) => onLangChange("title", e.target.value)}
          placeholder={`e.g. Delicious Burger`}
          className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">
          Description
        </label>
        <textarea
          rows={3}
          value={formData.description[activeLang] || ""}
          onChange={(e) => onLangChange("description", e.target.value)}
          placeholder={`Ingredients, allergies...`}
          className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
