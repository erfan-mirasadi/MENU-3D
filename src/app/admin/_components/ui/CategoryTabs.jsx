"use client";
export default function CategoryTabs({ categories, activeTab, onTabChange }) {
  return (
    <div className="w-full border-b border-gray-700 mb-8">
      <div className="flex gap-8 overflow-x-auto pb-2 no-scrollbar px-4 sm:px-0">
        <button
          onClick={() => onTabChange("all")}
          className={`pb-2 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "all"
              ? "text-primary border-b-2 border-primary"
              : "text-text-dim hover:text-white"
          }`}
        >
          All Dishes
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onTabChange(cat.id)}
            className={`whitespace-nowrap pb-2 text-sm font-semibold transition-all ${
              activeTab === cat.id
                ? "text-primary border-b-2 border-primary"
                : "text-text-dim hover:text-white"
            }`}
          >
            {cat.title?.en || "Category"}
          </button>
        ))}
      </div>
    </div>
  );
}
