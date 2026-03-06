"use client";
import { useEffect, useRef, useState } from "react";

export default function ARViewer({ modelUrl, modelUrlIos, posterUrl, alt, children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const modelViewerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    const isDefined = customElements.get("model-viewer");

    if (!isDefined) {
      import("@google/model-viewer")
        .then(() => {
        })
        .catch((err) => {
          if (!err.message.includes("already been used")) {
            console.error("3D Load Error:", err);
          }
        });
    }
  }, []);

  if (!isMounted) return null;

  // On iOS, use the iOS-specific GLB (without KTX2) if available
  const finalSrc = (isIOS && modelUrlIos) ? modelUrlIos : modelUrl;

  return (
    <model-viewer
      ref={modelViewerRef}
      src={finalSrc}
      poster={posterUrl}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="auto"
      ar-placement="floor"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      shadow-softness="0.8"
      tone-mapping="commerce"
      interaction-prompt="auto"
      interaction-prompt-style="wiggle"
      style={{ width: "100%", height: "100%", outline: "none" }}
    >
      {children}
    </model-viewer>
  );
}
