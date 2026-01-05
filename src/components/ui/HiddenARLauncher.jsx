"use client";

import { useEffect, useState, useRef } from "react";

export default function HiddenARLauncher({ activeModelUrl, onRef }) {
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef(null);

  // 1. Lazy Load Library & Configure Decoders ONLY when URL is provided
  useEffect(() => {
    if (!activeModelUrl) return;

    const prepareModelViewer = async () => {
      try {
        let ModelViewerClass = customElements.get("model-viewer");

        if (!ModelViewerClass) {
          const module = await import("@google/model-viewer");
          ModelViewerClass = module.ModelViewerElement;
        }

        // ✅ Config Global Decoders (Idempotent safe)
        if (ModelViewerClass) {
          ModelViewerClass.meshoptDecoderLocation =
            "/libs/meshopt/meshopt_decoder.js";
          ModelViewerClass.ktx2TranscoderLocation = "/libs/basis/";
        }

        setIsReady(true);
      } catch (err) {
        console.error("Failed to preload model-viewer:", err);
      }
    };
    prepareModelViewer();
  }, [activeModelUrl]);

  // 2. Auto-activate when ready (Triggered by the state change initiated by click)
  useEffect(() => {
    if (isReady && activeModelUrl) {
      // Attempt activation. Note: On strict mobile browsers, this might fail 
      // if the download took too long and the gesture expired.
      const viewer = internalRef.current;
      if (viewer && viewer.activateAR) {
        viewer.activateAR();
      }
    }
  }, [isReady, activeModelUrl]);

  if (!activeModelUrl) return null;

  return (
    <div
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <model-viewer
        ref={(el) => {
           internalRef.current = el;
           if (onRef) onRef(el);
        }}
        src={isReady ? activeModelUrl : undefined}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        loading="eager"
        meshopt-decoder-path="/libs/meshopt/meshopt_decoder.module.js"
        ktx2-transcoder-path="/libs/basis/"
      ></model-viewer>
    </div>
  );
}