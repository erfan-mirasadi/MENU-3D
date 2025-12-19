"use client";

import { useEffect, useRef } from "react";

const ThreeDViewer = ({ src, poster, alt, children, ...props }) => {
  const isLoaded = useRef(false);

  // 🔍 LOG 1: Render Cycle
  // این لاگ هر بار که کامپوننت رندر بشه چاپ میشه.
  // اگر بهینه‌سازی درست باشه، فقط وقتی کارت میاد تو صفحه باید اینو ببینی.
  console.log(`🎨 [ThreeDViewer Rendered] for: ${alt}`);

  useEffect(() => {
    // جلوگیری از اجرای تکراری در React Strict Mode
    if (isLoaded.current) return;
    isLoaded.current = true;

    // 🛡️ CRASH FIX: Check if already defined
    // فقط در صورتی ایمپورت کن که قبلاً ثبت نشده باشه
    if (typeof window !== "undefined" && !customElements.get("model-viewer")) {
      console.log("📥 [Network] Importing @google/model-viewer library...");

      import("@google/model-viewer")
        .then(() => {
          console.log("✅ [System] <model-viewer> registered successfully.");
        })
        .catch((err) => {
          console.error("❌ Error loading model-viewer:", err);
        });
    } else {
      console.log(
        "⏩ [System] <model-viewer> already exists. Skipping import."
      );
    }
  }, []);

  return (
    <model-viewer
      src={src}
      poster={poster}
      alt={alt}
      // Performance Settings
      loading="eager" // ما خودمون با Next.js لیزی لود کردیم، پس اینجا ایگر میذاریم
      camera-controls
      auto-rotate
      shadow-intensity="1"
      // Layout Fixes
      style={{
        width: "100%",
        height: "100%",
        outline: "none",
        display: "block", // این خیلی مهمه برای جلوگیری از پرش
      }}
      {...props}
    >
      {children}
    </model-viewer>
  );
};

export default ThreeDViewer;
