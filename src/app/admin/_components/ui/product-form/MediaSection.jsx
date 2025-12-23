// src/app/admin/_components/ui/product-form/MediaSection.jsx
import { RiImageLine, RiLock2Line } from "react-icons/ri";

export default function MediaSection({ formData, setFormData, isEditing }) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <RiImageLine className="text-primary" /> Media Assets
      </h3>

      {/* If editing, show read-only message */}
      {isEditing && (
        <div className="text-xs text-yellow-500 flex items-center gap-1 mb-2">
          <RiLock2Line /> Media editing is currently disabled.
        </div>
      )}

      <div className="relative group">
        <RiImageLine className="absolute left-3 top-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Image URL..."
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
          readOnly={isEditing}
          className={`w-full bg-dark-800 border border-gray-700 rounded-xl p-3 pl-10 text-white focus:outline-none text-sm ${
            isEditing ? "opacity-50 cursor-not-allowed" : "focus:border-primary"
          }`}
        />
      </div>
    </div>
  );
}
