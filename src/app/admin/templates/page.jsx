"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { RiCheckLine, RiLayoutMasonryLine } from "react-icons/ri";
import Loader from "@/app/admin/_components/ui/Loader";

// Hardcoded Owner ID (Replace with auth later)
// const TEST_OWNER_ID = "795d61c8-a279-4716-830c-b5919180a75f";

// Template Definitions (All pointing to your video for now)
const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Menu",
    description: "Elegant and timeless design.",
    videoSrc: "/templates/classic.mov", // Your video path
  },
  {
    id: "modern",
    name: "Modern Dark",
    description: "Best for night clubs and cafes.",
    videoSrc: "/templates/modern.mov", // Change later
  },
  {
    id: "minimal",
    name: "Minimal Light",
    description: "Clean, bright, and simple.",
    videoSrc: "/templates/minimal.mov", // Change later
  },
  {
    id: "immersive",
    name: "Immersive Bold",
    description: "Colorful and high energy.",
    videoSrc: "/templates/immersive.mov", // Change later
  },
];

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState("classic");
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function initData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        const { data, error } = await supabase
          .from("restaurants")
          .select("template_id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setActiveTemplate(data.template_id || "classic");
        }
      } catch (error) {
        console.error("Error init templates:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // 2. Handle Template Selection
  const handleSelectTemplate = async (templateId) => {
    if (templateId === activeTemplate) return;

    setActivatingId(templateId);

    // Update in Supabase
    const { error } = await supabase
      .from("restaurants")
      .update({ template_style: templateId })
      .eq("owner_id", TEST_OWNER_ID);

    if (error) {
      toast.error("Failed to change template.");
    } else {
      setActiveTemplate(templateId);
      toast.success("Template updated successfully!");
    }

    setActivatingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-dark-900 text-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 text-white p-6 sm:p-8 overflow-y-auto">
      {/* Header */}
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
        {TEMPLATES.map((template) => {
          const isActive = activeTemplate === template.id;
          const isProcessing = activatingId === template.id;

          return (
            <div
              key={template.id}
              className={`relative group rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                isActive
                  ? "border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
                  : "border-gray-800 hover:border-gray-600 bg-dark-800"
              }`}
            >
              {/* Video Container (Aspect Ratio ~ 9:19.5) */}
              <div className="relative w-full aspect-300/650 bg-gray-900">
                <video
                  src={template.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
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

                {/* Action Button */}
                <button
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={isActive || isProcessing}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-gray-800 text-gray-500 cursor-default"
                      : "bg-white text-black hover:bg-gray-200 shadow-lg"
                  }`}
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Activating...</span>
                  ) : isActive ? (
                    "Currently Active"
                  ) : (
                    "Select Template"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
