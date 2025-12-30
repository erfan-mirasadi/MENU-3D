"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import FoodItem from "./FoodItem";
import BackgroundParticles from "./BackgroundParticles";

function LinearCarousel({ products, activeIndex, gyroData, onModelLoaded }) {
  return (
    <group>
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
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 12], fov: 35 }}
        gl={{
          antialias: false,
          toneMappingExposure: 1.1,
          powerPreference: "high-performance",
          depth: true,
          stencil: false,
        }}
      >
        <color attach="background" args={["#000000"]} />

        <Environment preset="city" blur={0.8} resolution={256} />

        <ambientLight intensity={0.7} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1.2}
          color="#fff"
        />

        {activeProducts.length > 0 && (
          <LinearCarousel
            products={activeProducts}
            activeIndex={activeIndex}
            gyroData={gyroData}
            onModelLoaded={onModelLoaded} // Pass down to Carousel
          />
        )}

        <BackgroundParticles gyroData={gyroData} />

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
