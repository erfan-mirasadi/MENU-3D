"use client";

import { useEffect, useState, useRef } from "react";
import { MdClose, MdViewInAr } from "react-icons/md";

export default function HiddenARLauncher({ activeModelUrl, onRef, onClose }) {
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef(null);

  // 1. Lazy Load Library & Configure Decoders ONLY when URL is provided
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
      
      {/* Functionality: The Model Viewer (Hidden) */}
      <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
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

      {/* UI: Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
      >
        <MdClose size={24} />
      </button>

      {/* UI: Content */}
      <div className="flex flex-col items-center gap-8 text-center max-w-sm">
        
        {/* Animated Icon */}
        <div className="w-32 h-32 rounded-3xl bg-[#ea7c69]/20 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ea7c69]/30 to-transparent animate-pulse" />
          <MdViewInAr className={`text-6xl text-[#ea7c69] transition-all duration-700 ${isReady ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`} />
        </div>

        <div>
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            {isReady ? "AR Ready" : "Preparing AR..."}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            {isReady 
              ? "Tap the button below to place the item on your table." 
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