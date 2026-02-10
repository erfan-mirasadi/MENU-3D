import { RiAddLine } from "react-icons/ri";

export default function AddCard({ onClick, label = "Add new dish", isLoading = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group h-full w-full aspect-square rounded-2xl border-2 border-dashed border-gray-700 bg-dark-800/30 flex flex-col items-center justify-center gap-4 hover:bg-dark-800 hover:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-gray-800 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white transition-colors duration-300 shadow-lg">
        {isLoading ? (
           <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <RiAddLine size={32} />
        )}
      </div>
      <span className="text-gray-400 group-hover:text-primary font-semibold transition-colors">
        {isLoading ? "Processing..." : label}
      </span>
    </button>
  );
}
