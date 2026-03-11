import { useState } from "react";
import { RiImageLine, RiArrowDownSLine, RiArrowUpSLine, RiBox3Line, RiVideoChatLine, RiFileList3Line } from "react-icons/ri";
import R2FileUploader from "./R2FileUploader";

export default function MediaSection({ formData, setFormData, isEditing, restaurantSlug }) {
  const [openAccordion, setOpenAccordion] = useState(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAccordion = (name) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const renderAccordionHeader = (name, Icon, title) => (
    <button
      type="button"
      onClick={() => toggleAccordion(name)}
      className="w-full flex items-center justify-between p-4 bg-dark-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center gap-2 text-white font-medium">
        <Icon className="text-primary" /> {title}
      </div>
      {openAccordion === name ? (
        <RiArrowUpSLine className="text-gray-400" size={20} />
      ) : (
        <RiArrowDownSLine className="text-gray-400" size={20} />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <RiImageLine className="text-primary" /> Media Assets
      </h3>

      {/* Main Product Image (Always visible) */}
      <R2FileUploader
        label="Product Image (WEBP, JPG, PNG)"
        accept="image/webp, image/jpeg, image/png"
        maxSize={2}
        value={formData.image_url}
        onChange={(url) => updateField("image_url", url)}
        restaurantSlug={restaurantSlug}
      />

      <div className="space-y-4">
        {/* GIFs and Animations Accordion */}
        <div className="space-y-2">
          {renderAccordionHeader("animations", RiVideoChatLine, "GIFs & Animations")}
          {openAccordion === "animations" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-800 rounded-xl bg-dark-900/50 animate-in slide-in-from-top-2">
              <R2FileUploader
                label="Android Animation (.webm)"
                accept="video/webm, .webm"
                maxSize={5}
                value={formData.animation_url_android}
                onChange={(url) => updateField("animation_url_android", url)}
                restaurantSlug={restaurantSlug}
              />
              <R2FileUploader
                label="iOS Animation (.mov)"
                accept="video/quicktime, .mov"
                maxSize={5}
                value={formData.animation_url_ios}
                onChange={(url) => updateField("animation_url_ios", url)}
                restaurantSlug={restaurantSlug}
              />
            </div>
          )}
        </div>

        {/* 3D Models Accordion */}
        <div className="space-y-2">
          {renderAccordionHeader("models", RiBox3Line, "3D Models")}
          {openAccordion === "models" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-800 rounded-xl bg-dark-900/50 animate-in slide-in-from-top-2">
              <R2FileUploader
                label="3D Model (.glb, .gltf)"
                accept=".glb, .gltf"
                maxSize={5}
                value={formData.model_url}
                onChange={(url) => updateField("model_url", url)}
                restaurantSlug={restaurantSlug}
              />
              <R2FileUploader
                label="iOS 3D Model (.glb, .usdz)"
                accept=".glb, .usdz, .gltf"
                maxSize={5}
                value={formData.model_url_ios}
                onChange={(url) => updateField("model_url_ios", url)}
                restaurantSlug={restaurantSlug}
              />
            </div>
          )}
        </div>

        {/* Texture Maps (2.5D) Accordion */}
        <div className="space-y-2">
          {renderAccordionHeader("textures", RiFileList3Line, "Texture Maps (2.5D)")}
          {openAccordion === "textures" && (
            <div className="grid grid-cols-1 gap-4 p-4 border border-gray-800 rounded-xl bg-dark-900/50 animate-in slide-in-from-top-2">
              <R2FileUploader
                label="Normal Map (WEBP, JPG, PNG)"
                accept="image/webp, image/jpeg, image/png"
                maxSize={2}
                value={formData.normal_map_url}
                onChange={(url) => updateField("normal_map_url", url)}
                restaurantSlug={restaurantSlug}
              />
              <R2FileUploader
                label="Roughness/Metallic Map (WEBP, JPG, PNG)"
                accept="image/webp, image/jpeg, image/png"
                maxSize={2}
                value={formData.roughness_map_url}
                onChange={(url) => updateField("roughness_map_url", url)}
                restaurantSlug={restaurantSlug}
              />
              <R2FileUploader
                label="Ambient Occlusion Map (WEBP, JPG, PNG)"
                accept="image/webp, image/jpeg, image/png"
                maxSize={2}
                value={formData.ambient_map_url}
                onChange={(url) => updateField("ambient_map_url", url)}
                restaurantSlug={restaurantSlug}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
