import { RiImageLine, RiLock2Line } from "react-icons/ri";
import R2FileUploader from "./R2FileUploader";

export default function MediaSection({ formData, setFormData, isEditing, restaurantSlug }) {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <RiImageLine className="text-primary" /> Media Assets
      </h3>

      {/* Product Image */}
      <R2FileUploader
        label="Product Image (WEBP, JPG, PNG)"
        accept="image/webp, image/jpeg, image/png"
        maxSize={2}
        value={formData.image_url}
        onChange={(url) => updateField("image_url", url)}
        restaurantSlug={restaurantSlug}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3D Model */}
        <R2FileUploader
          label="3D Model (.glb, .gltf)"
          accept=".glb, .gltf"
          maxSize={5}
          value={formData.model_url}
          onChange={(url) => updateField("model_url", url)}
          restaurantSlug={restaurantSlug}
        />

        {/* Android Animation */}
        <R2FileUploader
          label="Android Animation (.webm)"
          accept="video/webm, .webm"
          maxSize={5}
          value={formData.animation_url_android}
          onChange={(url) => updateField("animation_url_android", url)}
          restaurantSlug={restaurantSlug}
        />

        {/* iOS Animation */}
        <R2FileUploader
          label="iOS Animation (.mov)"
          accept="video/quicktime, .mov"
          maxSize={5}
          value={formData.animation_url_ios}
          onChange={(url) => updateField("animation_url_ios", url)}
          restaurantSlug={restaurantSlug}
        />
      </div>
    </div>
  );
}
