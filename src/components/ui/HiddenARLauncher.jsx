"use client";
import { useState, useRef, useImperativeHandle } from "react";

export default function HiddenARLauncher({ arRef }) {
  const [url, setUrl] = useState(null);
  const [iosUrl, setIosUrl] = useState(null);
  const internalRef = useRef(null);
  const isSetup = useRef(false);

  useImperativeHandle(arRef, () => ({
    launchAR: async (modelUrl, modelUrlIos) => {
      try {
        if (!customElements.get("model-viewer")) {
           await import("@google/model-viewer");
        }

        if (!isSetup.current && customElements.get("model-viewer")) {
           const ModelViewerElement = customElements.get("model-viewer");
           ModelViewerElement.dracoDecoderLocation = "https://www.gstatic.com/draco/v1/decoders/";
           ModelViewerElement.meshoptDecoderLocation = "/libs/meshopt/meshopt_decoder.js";
           isSetup.current = true;
        }

        setUrl(modelUrl);
        setIosUrl(modelUrlIos);

        // iOS Fallback check - Using direct page navigation
        // Safari natively intercepts direct navigation to .usdz/.reality and launches AR Quick Look
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS && modelUrlIos) {
          window.location.href = modelUrlIos;
          return; // Skip model-viewer activation on iOS
        }

        // Default activation (Android / Web) requires a tiny delay for model-viewer to catch up
        setTimeout(() => {
           const viewer = internalRef.current;
           if (viewer) {
             viewer.activateAR();
           }
        }, 100);

      } catch (e) {
        console.error("AR Launch Error:", e);
      }
    }
  }));

  if (!url) return null;

  return (
    <>
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          <model-viewer
            ref={internalRef}
            src={url}
            {...(iosUrl ? { "ios-src": iosUrl } : {})}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
            ktx2-transcoder-path="/libs/basis/" 
            meshopt-decoder-path="/libs/meshopt/meshopt_decoder.js"
            loading="eager" 
            camera-controls
            onError={(e) => console.error("ModelViewer Error:", e)}
          ></model-viewer>
      </div>
    </>
  );
}