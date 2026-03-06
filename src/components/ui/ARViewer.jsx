"use client";
import { useEffect, useRef, useState } from "react";

export default function ARViewer({ modelUrl, modelUrlIos, posterUrl, alt, children }) {
  const [isMounted, setIsMounted] = useState(false);
  const modelViewerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
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

  const handleARClick = (e) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && modelUrlIos) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = modelUrlIos;
    }
  };

  return (
    <>
      <model-viewer
        ref={modelViewerRef}
        src={modelUrl}
        {...(modelUrlIos ? { "ios-src": modelUrlIos } : {})}
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
        onClick={handleARClick}
      >
        {children}
      </model-viewer>
    </>
  );
}
