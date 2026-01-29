import { RiDeleteBin6Line, RiSave3Line } from "react-icons/ri";
import Loader from "@/components/ui/Loader";

export default function FormActions({
  onClose,
  loading,
  deleting,
  isEditing,
  onDelete,
}) {
  return (
    <div className="pt-4 flex gap-4 pb-10 flex-col-reverse sm:flex-row">
      {/* Delete Button (Only in Edit Mode) */}
      {isEditing && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="py-3 px-4 rounded-xl border border-red-500/50 text-red-500 hover:bg-red-500/10 transition font-medium active:scale-90 flex items-center justify-center gap-2"
        >
          {deleting ? (
            <Loader variant="inline" className="w-5 h-5 text-red-500" />
          ) : (
            <>
              <RiDeleteBin6Line /> Delete Product
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition font-medium active:scale-90"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-orange-600 transition font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-85 border-2 border-green-900"
      >
          {loading ? (
          <Loader variant="inline" className="w-5 h-5 text-white" />
        ) : (
          <>
            <RiSave3Line size={20} className="text-green-100" />{" "}
            {isEditing ? "Update Product" : "Create Product"}
          </>
        )}
      </button>
    </div>
  );
}
