"use client";
import { useState, useEffect } from "react";
import { useRestaurantData } from "@/app/hooks/useRestaurantData"; // [NEW]
import {
  updateRestaurant,
} from "@/services/restaurantService";
import toast from "react-hot-toast";
import { RiCheckLine, RiLayoutMasonryLine } from "react-icons/ri";
import Loader from "@/components/ui/Loader";

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Menu",
    description: "Elegant and timeless design.",
    videoSrc: "/templates/classic.mov",
  },
  {
    id: "modern",
    name: "Modern Dark",
    description: "Best for night clubs and cafes.",
    videoSrc: "/templates/modern.mov",
  },
  {
    id: "minimal",
    name: "Minimal Light",
    description: "Clean, bright, and simple.",
    videoSrc: "/templates/minimal.mov",
  },
  {
    id: "immersive",
    name: "Immersive Bold",
    description: "Colorful and high energy.",
    videoSrc: "/templates/immersive.mov",
  },
  {
    id: "three-d",
    name: "3D Experience",
    description: "Interactive 3D food models.",
    videoSrc: "/templates/3d.mov",
  },
];

export default function TemplatesPage() {
  const { restaurant, loading: contextLoading, refetch } = useRestaurantData();
  const [activeTemplate, setActiveTemplate] = useState("modern");
  const [activatingId, setActivatingId] = useState(null);
  
  // Sync state from context
  useEffect(() => {
    if (restaurant?.template_style) {
        setActiveTemplate(restaurant.template_style);
    }
  }, [restaurant]);

  const handleSelectTemplate = async (templateStyle) => {
    if (templateStyle === activeTemplate) return;

    setActivatingId(templateStyle);

    try {
      await updateRestaurant(restaurant?.owner_id, { template_style: templateStyle }); // Use ID from context
      setActiveTemplate(templateStyle);
      toast.success("Template updated successfully!");
      refetch(restaurant?.id);
    } catch (error) {
      toast.error("Failed to change template.");
    }

    setActivatingId(null);
  };

  if (contextLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 text-white p-6 sm:p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <RiLayoutMasonryLine className="text-primary" /> Templates
        </h1>
        <p className="text-text-dim">
          Choose a visual style for your digital menu.
        </p>
      </div>

      {/* Templates Grid - Adapted for Vertical Videos (296x640) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 pb-20">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            activeTemplate={activeTemplate}
            activatingId={activatingId}
            onSelect={handleSelectTemplate}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, activeTemplate, activatingId, onSelect }) {
  const [videoLoading, setVideoLoading] = useState(true);
  const isActive = activeTemplate === template.id;
  const isProcessing = activatingId === template.id;

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
        isActive
          ? "border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
          : "border-gray-800 hover:border-gray-600 bg-dark-800"
      }`}
    >
      {/* Video Container (Aspect Ratio ~ 9:19.5) */}
      <div className="relative w-full aspect-300/650 bg-gray-900">
        {videoLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
             <Loader variant="inline" className="w-8 h-8 text-white/50" />
          </div>
        )}
        
        <video
          src={template.videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoading(false)}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Status Badge (Top Right) */}
        {isActive && (
          <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <RiCheckLine /> Active
          </div>
        )}
      </div>

      {/* Content Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-xl text-white mb-1">
            {template.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2">
            {template.description}
          </p>
        </div>
        <button
          onClick={() => onSelect(template.id)}
          disabled={isActive || isProcessing}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isActive
              ? "bg-gray-800 text-gray-500 cursor-default"
              : "bg-white text-black hover:bg-gray-200 shadow-lg"
          }`}
        >
          {isProcessing ? (
            <Loader variant="inline" className="w-5 h-5 text-black" />
          ) : isActive ? (
            "Currently Active"
          ) : (
            "Select Template"
          )}
        </button>
      </div>
    </div>
  );
}
