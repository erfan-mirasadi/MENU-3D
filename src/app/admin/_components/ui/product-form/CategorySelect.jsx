// src/app/admin/_components/ui/product-form/CategorySelect.jsx
export default function CategorySelect({ categories, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-400">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
      >
        <option value="" disabled>
          Select a category...
        </option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.title?.en || cat.title?.tr || "Unnamed Category"}
          </option>
        ))}
      </select>
    </div>
  );
}
