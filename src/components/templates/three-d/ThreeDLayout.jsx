"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Scene from "./Scene";
import UIOverlay from "./UIOverlay";
import { useGLTF, useProgress } from "@react-three/drei"; // Added useProgress for real loading state

// --- GLOBAL VARIABLES ---
// Shared object for gyroscope data to avoid React re-renders.
// This logic remains UNTOUCHED as requested.
const gyroData = { x: 0, y: 0 };
const GYRO_INTENSITY = 40;

export default function ThreeDLayout({ restaurant, categories }) {
  // --- STATE MANAGEMENT ---
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id);
  const [activeIndex, setActiveIndex] = useState(0);

  // REAL LOADER LOGIC:
  const { active } = useProgress();

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Refs for permission logic
  const lastPermissionDenyTime = useRef(0);
  const isPermissionGranted = useRef(false);

  // Compute active products
  const activeProducts = useMemo(() => {
    return categories.find((c) => c.id === activeCatId)?.products || [];
  }, [activeCatId, categories]);

  const focusedProduct = activeProducts[activeIndex] || activeProducts[0];

  // --- LOGIC: CATEGORY TRANSITION ---
  useEffect(() => {
    setActiveIndex(0);
    // Clear GLTF Cache when category changes to free memory
    useGLTF.clear();
  }, [activeCatId]);

  // --- LOGIC: SMART PRELOADING ---
  useEffect(() => {
    if (!activeProducts.length) return;
    const priorityList = new Set([
      0,
      1,
      activeIndex,
      activeIndex + 1,
      activeIndex - 1,
    ]);

    priorityList.forEach((idx) => {
      if (idx >= 0 && idx < activeProducts.length) {
        const product = activeProducts[idx];
        if (product?.model_url) {
          useGLTF.preload(product.model_url);
        }
      }
    });
  }, [activeIndex, activeProducts]);

  // --- LOGIC: GYROSCOPE SENSOR (Android/Standard Auto-Start) ---
  useEffect(() => {
    const handleOrientation = (event) => {
      gyroData.x = (event.beta || 0) / GYRO_INTENSITY;
      gyroData.y = (event.gamma || 0) / GYRO_INTENSITY;
    };

    // 1. Android & Non-iOS devices (Auto-start without permission)
    if (
      typeof window !== "undefined" &&
      window.DeviceOrientationEvent &&
      typeof window.DeviceOrientationEvent.requestPermission !== "function"
    ) {
      window.addEventListener("deviceorientation", handleOrientation);
      isPermissionGranted.current = true;
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  // --- LOGIC: iOS PERMISSION HANDLER (The "Capture" Trick) ---
  // We use this function directly on the main div's onClickCapture
  const handleIOSPermission = useCallback(async () => {
    // A. Stop if already granted
    if (isPermissionGranted.current) return;

    // B. Check if this is an iOS device requiring permission
    if (
      typeof DeviceOrientationEvent === "undefined" ||
      typeof DeviceOrientationEvent.requestPermission !== "function"
    ) {
      return;
    }

    // C. Cooldown Logic (30 Seconds)
    const now = Date.now();
    if (now - lastPermissionDenyTime.current < 30000) {
      // Still in cooldown, do not ask, let the click pass through
      return;
    }

    try {
      // D. Request Permission
      const permission = await DeviceOrientationEvent.requestPermission();

      if (permission === "granted") {
        isPermissionGranted.current = true;
        // Attach the listener immediately
        window.addEventListener("deviceorientation", (event) => {
          gyroData.x = (event.beta || 0) / GYRO_INTENSITY;
          gyroData.y = (event.gamma || 0) / GYRO_INTENSITY;
        });
      } else {
        // Denied: Reset timer
        lastPermissionDenyTime.current = Date.now();
      }
    } catch (error) {
      console.warn("Gyro permission denied or error", error);
      // Error means denied usually, reset timer
      lastPermissionDenyTime.current = Date.now();
    }
  }, []);

  // --- LOGIC: TOUCH GESTURES ---
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const isSwipe =
        Math.abs(deltaX) > 40 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
        deltaTime < 500;

      if (isSwipe) {
        if (deltaX > 0 && activeIndex > 0) {
          setActiveIndex((prev) => prev - 1);
        } else if (deltaX < 0 && activeIndex < activeProducts.length - 1) {
          setActiveIndex((prev) => prev + 1);
        }
      }
    },
    [activeIndex, activeProducts.length]
  );

  useEffect(() => {
    const element = document.querySelector(".three-d-container");
    if (!element) return;
    const handleTouchMove = (e) => {
      if (!e.target.closest(".category-scroll")) {
        e.preventDefault();
      }
    };
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => element.removeEventListener("touchmove", handleTouchMove);
  }, []);

  return (
    <div
      className="three-d-container relative w-full h-[100dvh] bg-black overflow-hidden select-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // TRICK: onClickCapture triggers BEFORE any child element handles the click.
      // This ensures we catch the very first interaction anywhere on screen.
      onClickCapture={handleIOSPermission}
    >
      {/* --- LOADER UI --- */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none transition-all duration-300 flex items-center justify-center
        ${
          active
            ? "backdrop-blur-md bg-black/40 opacity-100"
            : "backdrop-blur-0 bg-transparent opacity-0"
        }`}
      >
        {active && (
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        )}
      </div>

      <Scene
        activeProducts={activeProducts}
        activeIndex={activeIndex}
        gyroData={gyroData}
      />

      <UIOverlay
        restaurant={restaurant}
        categories={categories}
        activeCatId={activeCatId}
        setActiveCatId={setActiveCatId}
        focusedProduct={focusedProduct}
        categoryMounted={!active}
      />
    </div>
  );
}
