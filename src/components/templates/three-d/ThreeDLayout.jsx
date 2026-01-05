"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Scene from "./Scene";
import UIOverlay from "./UIOverlay";
import Loader from "@/components/ui/Loader";
import HiddenARLauncher from "@/components/ui/HiddenARLauncher";
import { useParams } from "next/navigation";
import { useCart } from "@/app/hooks/useCart";

// --- GLOBAL VARIABLES ---
const gyroData = { x: 0, y: 0 };
const GYRO_INTENSITY = 40;

export default function ThreeDLayout({ restaurant, categories }) {
  const params = useParams();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    decreaseFromCart,
    submitOrder,
    isLoading: isLoadingCart,
  } = useCart(params?.table_id);

  // --- STATE ---
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBlobUrl, setCurrentBlobUrl] = useState(null); // Local blob URL from FoodItem

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const activeProducts = useMemo(() => {
    return categories.find((c) => c.id === activeCatId)?.products || [];
  }, [activeCatId, categories]);

  const focusedProduct = activeProducts[activeIndex] || activeProducts[0];

  useEffect(() => {
    setActiveIndex(0);
    const selectedCategory = categories.find((c) => c.id === activeCatId);
    const hasProducts = selectedCategory?.products?.length > 0;
    if (hasProducts) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [activeCatId, categories]);

  const handleModelLoaded = useCallback((url) => {
    setIsLoading(false);
    if (url) setCurrentBlobUrl(url);
  }, []);

  const arLauncherRef = useRef();
  
  const handleLaunchAR = useCallback(() => {
    // Direct trigger for headless AR
    const urlToUse = currentBlobUrl || focusedProduct?.model_url;
    if (arLauncherRef.current && urlToUse) {
        arLauncherRef.current.launchAR(urlToUse);
    }
  }, [currentBlobUrl, focusedProduct]);

  // --- LOGIC: GYROSCOPE ---
  useEffect(() => {
    const handleOrientation = (event) => {
      gyroData.x = (event.beta || 0) / GYRO_INTENSITY;
      gyroData.y = (event.gamma || 0) / GYRO_INTENSITY;
    };

    const requestAccess = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted")
            window.addEventListener("deviceorientation", handleOrientation);
        } catch (error) {}
      }
    };

    if (
      typeof window !== "undefined" &&
      window.DeviceOrientationEvent &&
      typeof window.DeviceOrientationEvent.requestPermission !== "function"
    ) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    // iOS Trigger (Wait for first interaction)
    if (typeof window !== "undefined") {
      const options = { once: true, capture: true };
      window.addEventListener("touchstart", requestAccess, options);
      window.addEventListener("click", requestAccess, options);
      window.addEventListener("pointerdown", requestAccess, options);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pointerdown", requestAccess);
        window.removeEventListener("touchstart", requestAccess);
        window.removeEventListener("deviceorientation", handleOrientation);
        window.removeEventListener("click", requestAccess);
      }
    };
  }, []);

  // --- LOGIC: TOUCH GESTURES ---
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest(".category-scroll")) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!touchStartRef.current || touchStartRef.current.time === 0) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const isSwipe =
        Math.abs(deltaX) > 40 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
        deltaTime < 500;

      if (isSwipe) {
        if (deltaX > 0 && activeIndex > 0) setActiveIndex((prev) => prev - 1);
        else if (deltaX < 0 && activeIndex < activeProducts.length - 1)
          setActiveIndex((prev) => prev + 1);
      }
      touchStartRef.current = { x: 0, y: 0, time: 0 };
    },
    [activeIndex, activeProducts.length]
  );



  return (
    <div
      className="three-d-container relative w-full h-[100dvh] bg-black overflow-hidden select-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* --- CUSTOM SMOOTH LOADER --- */}
      <Loader active={isLoading} />

      <Scene
        activeProducts={activeProducts}
        activeIndex={activeIndex}
        gyroData={gyroData}
        onModelLoaded={handleModelLoaded}
      />

      <HiddenARLauncher 
        ref={arLauncherRef} 
      />

      <UIOverlay
        restaurant={restaurant}
        categories={categories}
        activeCatId={activeCatId}
        setActiveCatId={setActiveCatId}
        focusedProduct={focusedProduct}
        onLaunchAR={handleLaunchAR}
        categoryMounted={!isLoading}
        cartItems={cartItems}
        addToCart={addToCart}
        decreaseFromCart={decreaseFromCart}
        removeFromCart={removeFromCart}
        submitOrder={submitOrder}
        isLoadingCart={isLoadingCart}
        /* --- NAVIGATION PROPS --- */
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        productCount={activeProducts.length}
      />
    </div>
  );
}