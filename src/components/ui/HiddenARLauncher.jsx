"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

const HiddenARLauncher = forwardRef(({ activeModelUrl }, ref) => {
  const modelViewerRef = useRef(null);

  // Load model-viewer script if not already available
  useEffect(() => {
    const isDefined = customElements.get("model-viewer");
    if (!isDefined) {
      import("@google/model-viewer").catch((err) => {
        if (!err.message.includes("already been used")) {
          console.error("Failed to load model-viewer:", err);
        }
      });
    }
  }, []);

  // Expose launch method to parent
  useImperativeHandle(ref, () => ({
    launchAR: () => {
        const viewer = modelViewerRef.current;
        if (viewer && viewer.activateAR) {
            viewer.activateAR();
        } else {
            console.warn("AR not supported or model-viewer not ready");
        }
    }
  }));

  if (!activeModelUrl) return null;

  return (
    <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={activeModelUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        camera-controls
        auto-rotate
        loading="eager" 
        ktx2-transcoder-path="/libs/basis/"
        draco-decoder-path="https://www.gstatic.com/draco/v1/decoders/"
        meshopt-decoder-path="https://unpkg.com/meshoptimizer@0.19.0/meshopt_decoder.js"
      >
      </model-viewer>
    </div>
  );
});

HiddenARLauncher.displayName = "HiddenARLauncher";

export default HiddenARLauncher;
