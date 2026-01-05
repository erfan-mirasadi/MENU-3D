"use client";

import { useEffect, useState, useRef } from "react";
import { MdClose, MdViewInAr } from "react-icons/md";

export default function HiddenARLauncher({ activeModelUrl, onRef, onClose }) {
  const [status, setStatus] = useState("loading"); // loading | ready | converting | error
  const [blobUrl, setBlobUrl] = useState(null);
  const internalRef = useRef(null);

  // 1. Lazy Load Library & Configure Decoders ONLY when URL is provided
  useEffect(() => {
    if (!activeModelUrl) {
      setStatus('loading');
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

        // Library loaded, now we wait for the model to load
        setStatus("downloading");
      } catch (err) {
        console.error("Failed to preload model-viewer:", err);
        setStatus("error");
      }
    };
    prepareModelViewer();

    // Cleanup for blob URL if component unmounts or activeModelUrl changes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [activeModelUrl, blobUrl]);

  // 2. Handle Activation
  const handleLaunch = async () => {
    const viewer = internalRef.current;
    if (!viewer) return;

    // اگر اندروید باشه، مستقیم اجرا میشه
    // اگر آیفون باشه، ما دستی تبدیلش میکنیم تا مطمئن شیم سالمه
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        try {
            setStatus("converting"); // نمایش لودینگ به کاربر
            console.log("🍏 iOS detected: Starting manual USDZ conversion...");
            
            // شاه‌کلید ماجرا: درخواست مستقیم برای ساخت فایل USDZ
            const blob = await viewer.exportScene({ format: 'usdz' });
            const url = URL.createObjectURL(blob);
            
            // ست کردن فایل ساخته شده به عنوان سورس آیفون
            viewer.setAttribute("ios-src", url);
            setBlobUrl(url); // ذخیره برای پاکسازی بعدی
            
            console.log("🍏 Conversion success! Launching AR...");
            viewer.activateAR();
            setStatus("ready"); // Revert to ready after launch attempt
            
        } catch (error) {
            console.error("🍏 Conversion Failed:", error);
            alert("iOS AR Error: Could not convert KTX2 texture. Try a non-compressed model.");
            setStatus("ready"); // Revert to ready after error
        }
    } else {
        // برای اندروید هیچ کاری لازم نیست
        viewer.activateAR();
    }
  };

  if (!activeModelUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* ✅ FIX 1: Opacity نباید صفر مطلق باشه. سافاری گاهی رندر رو قطع میکنه.
         میذاریم 0.01 که دیده نشه ولی زنده بمونه.
      */}
      <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0.01, pointerEvents: 'none' }}>
        <model-viewer
          ref={(el) => {
             internalRef.current = el;
             if (onRef) onRef(el);
             
             // Listen for model load completion
             if (el) {
               el.addEventListener('load', () => {
                 console.log("Model loaded fully. Ready for AR.");
                 setStatus("ready");
               }, { once: true }); // Only trigger once per model
               
               el.addEventListener('error', (e) => {
                 console.error("Model load error:", e.detail);
                 setStatus("error");
               });
             }
          }}
          src={!["loading", "error"].includes(status) ? activeModelUrl : undefined}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          loading="eager"
          
          // ✅ FIX 2: Scale Auto (حیاتی برای جلوگیری از مورچه شدن مدل)
          ar-scale="auto"
          ar-placement="floor"
          
          // تنظیمات سایه برای دیده شدن بهتر
          shadow-intensity="1"
          
          // آدرس دیکدرها
          meshopt-decoder-path="/libs/meshopt/meshopt_decoder.js"
          ktx2-transcoder-path="/libs/basis/"
        ></model-viewer>
      </div>

      {/* UI: Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 z-20"
      >
        <MdClose size={24} />
      </button>

      {/* UI: Content */}
      <div className="flex flex-col items-center gap-8 text-center w-full max-w-md">
        
        {/* Preview Box */}
        <div className="w-full aspect-square max-w-[300px] rounded-3xl bg-[#ea7c69]/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#ea7c69]/30 to-transparent animate-pulse" />
           <MdViewInAr className={`text-8xl text-[#ea7c69] relative z-10 transition-all ${['converting', 'loading', 'downloading'].includes(status) ? 'animate-spin' : 'opacity-50'}`} />
        </div>

        <div>
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            {status === "ready" ? "AR Ready" : status === "converting" ? "Optimizing for iPhone..." : "Loading Assets..."}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            {status === "converting" 
                ? "Converting high-quality textures for iOS. This takes a few seconds." 
                : status === "ready"
                  ? "Tap below to place it on your table."
                  : "Downloading 3D model..."}
          </p>
        </div>

        {status === "ready" && (
          <button
            onClick={handleLaunch}
            className="w-full bg-[#ea7c69] text-white font-bold py-5 rounded-2xl shadow-[0_0_40px_-5px_#ea7c69] hover:shadow-[0_0_60px_-10px_#ea7c69] hover:scale-105 active:scale-95 transition-all duration-300 text-lg uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <span>View on Table</span>
            <MdViewInAr size={24} />
          </button>
        )}
        
        {/* دکمه غیرفعال موقع تبدیل */}
        {status !== "ready" && status !== "error" && (
             <div className="w-full bg-white/10 text-white/50 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 cursor-wait">
                <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                <span>{status === "converting" ? "Processing..." : "Downloading..."}</span>
             </div>
        )}

      </div>
    </div>
  );
}