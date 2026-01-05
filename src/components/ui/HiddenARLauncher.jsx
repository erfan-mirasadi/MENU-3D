"use client";

import { useEffect, useState, useRef } from "react";
import { MdClose, MdViewInAr } from "react-icons/md";

export default function HiddenARLauncher({ activeModelUrl, onRef, onClose }) {
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef(null);

  // 1. Lazy Load Library ONLY (Configuration handled by attributes)
  useEffect(() => {
    if (!activeModelUrl) {
      setIsReady(false);
      return;
    }

    const prepareModelViewer = async () => {
      try {
        let ModelViewerClass = customElements.get("model-viewer");

        if (!ModelViewerClass) {
          const module = await import("@google/model-viewer");
          ModelViewerClass = module.ModelViewerElement;
        }

        // Restore imperative config to ensure loader has access to decoder immediately
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

  // 2. Handle Activation
  const handleLaunch = () => {
    const viewer = internalRef.current;
    if (viewer && viewer.activateAR) {
      viewer.activateAR();
    }
  };

  if (!activeModelUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* UI: Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 z-20"
      >
        <MdClose size={24} />
      </button>

      {/* UI: Content */}
      <div className="flex flex-col items-center gap-8 text-center w-full max-w-md">
        
        {/* Model Preview / Loading Icon */}
        <div className="w-full aspect-square max-w-[300px] rounded-3xl bg-[#ea7c69]/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
           
           {isReady ? (
             <model-viewer
                ref={(el) => {
                   internalRef.current = el;
                   if (onRef) onRef(el);
                   // Add error listener for debugging AR issues
                   if (el) {
                     el.addEventListener('error', (e) => {
                       console.error("AR/Model Error:", e.detail);
                     });
                   }
                }}
                src={activeModelUrl}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="auto"
                ar-placement="floor"
                shadow-intensity="1"
                camera-controls
                auto-rotate
                loading="eager"
                meshopt-decoder-path="/libs/meshopt/meshopt_decoder.js"
                ktx2-transcoder-path="/libs/basis/"
                style={{ width: '100%', height: '100%' }}
             ></model-viewer>
           ) : (
             <> 
               <div className="absolute inset-0 bg-gradient-to-tr from-[#ea7c69]/30 to-transparent animate-pulse" />
               <MdViewInAr className="text-8xl text-[#ea7c69] opacity-50 relative z-10" />
             </>
           )}
        </div>

        <div>
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            {isReady ? "AR Ready" : "Preparing AR..."}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            {isReady 
              ? "Preview the model above. Tap 'Start Experience' to view it in your space." 
              : "Downloading 3D assets. Please wait a moment..."}
          </p>
        </div>

        {isReady ? (
          <button
            onClick={handleLaunch}
            className="w-full bg-[#ea7c69] text-white font-bold py-5 rounded-2xl shadow-[0_0_40px_-5px_#ea7c69] hover:shadow-[0_0_60px_-10px_#ea7c69] hover:scale-105 active:scale-95 transition-all duration-300 text-lg uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <span>Start Experience</span>
            <MdViewInAr size={24} />
          </button>
        ) : (
           <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-4 border-[#ea7c69] border-t-transparent rounded-full animate-spin" />
             <span className="text-xs text-[#ea7c69] font-mono animate-pulse">LOADING ASSETS...</span>
           </div>
        )}
      </div>
    </div>
  );
}