"use client";
import { Canvas} from "@react-three/fiber";
import { Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import FoodItem from "./FoodItem";
import BackgroundParticles from "./BackgroundParticles";
import SteamEffect from "./SteamEffect";

function LinearCarousel({ products, activeIndex, gyroData, onModelLoaded }) {
  return (
    <group dispose={null}>
      {products.map((product, i) => (
        <FoodItem
          key={`${product.id}-${i}`}
          index={i}
          product={product}
          activeIndex={activeIndex}
          gyroData={gyroData}
          // Pass onLoad ONLY if this is the active item
          onLoad={i === activeIndex ? onModelLoaded : undefined}
        />
      ))}
    </group>
  );
}

export default function Scene({
  activeProducts,
  activeIndex,
  gyroData,
  onModelLoaded,
}) {
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows={false}
        dpr={dpr}
        camera={{ position: [0, 0, 12], fov: 35 }}
        gl={{
          antialias: false,
          toneMappingExposure: 1.1,
          powerPreference: "high-performance",
          depth: true,
          stencil: false,
          precision: "mediump",
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <color attach="background" args={["#000000"]} />

        {/* Warmer environment for appetizing reflections */}
        <Environment preset="sunset" blur={0.6} active={true} background={false} />

        {/* Ambient light for base visibility */}
        <ambientLight intensity={0.5} />

        {/* Main Key Light - Warm & Bright */}
        <spotLight
          position={[5, 8, 5]}
          angle={0.4}
          penumbra={0.5}
          intensity={2}
          color="#fffaee"
        />

        {/* Rim Light - Cool/Blueish for contrast and edge definition */}
        <spotLight
          position={[-5, 5, -5]}
          angle={0.4}
          penumbra={1}
          intensity={1.5}
          color="#d0eaff"
        />

        {/* Fill Light - Soft Warmth */}
        <pointLight position={[-2, -2, 2]} intensity={0.5} color="#ffaa00" />

        {activeProducts.length > 0 && (
          <LinearCarousel
            products={activeProducts}
            activeIndex={activeIndex}
            gyroData={gyroData}
            onModelLoaded={onModelLoaded} // Pass down to Carousel
          />
        )}

        <BackgroundParticles gyroData={gyroData} />

        {/* Global Independent Steam for active item */}
        <SteamEffect />

        <Suspense fallback={null}>
          <ContactShadows
            position={[0, -4, 0]}
            opacity={0.4}
            scale={15}
            blur={2.5}
            far={3}
            resolution={128}
            color="#000000"
            frames={1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
