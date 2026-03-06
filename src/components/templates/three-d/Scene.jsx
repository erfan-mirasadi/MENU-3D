"use client";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import FoodItem from "./FoodItem";
import BackgroundParticles from "./BackgroundParticles";
// import SteamEffect from "./SteamEffect";

function SceneLights() {
  return (
    <>
      <ambientLight intensity={2} />

      <spotLight
        position={[3, 3, 8]}
        angle={0.3}
        penumbra={0.5}
        intensity={100}
        color="#fffaee"
        distance={20}
        decay={2}
      />

      <spotLight
        position={[-4, 3, 6]}
        angle={0.4}
        penumbra={1}
        intensity={50}
        color="#d0eaff"
        distance={20}
        decay={2}
      />

      <pointLight
        position={[-1, 1, 0]}
        intensity={3}
        color="#ffaa00"
        distance={10}
        decay={2}
      />
    </>
  );
}

function LinearCarousel({ products, activeIndex, gyroData, onModelLoaded }) {
  const visibleItems = useMemo(() => {
    const start = Math.max(0, activeIndex - 2);
    const end = Math.min(products.length - 1, activeIndex + 2);
    const items = [];

    for (let i = start; i <= end; i += 1) {
      items.push({ product: products[i], index: i });
    }

    return items;
  }, [products, activeIndex]);

  return (
    <group dispose={null}>
      {visibleItems.map(({ product, index }) => (
        <FoodItem
          key={`${product.id}-${index}`}
          index={index}
          product={product}
          activeIndex={activeIndex}
          gyroData={gyroData}
          // Pass onLoad ONLY if this is the active item
          onLoad={index === activeIndex ? onModelLoaded : undefined}
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
  enableEffects,
}) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows={false}
        dpr={1.7}
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
        <color attach="background" args={["#000000"]} />

        <SceneLights />

        {activeProducts.length > 0 && (
          <LinearCarousel
            products={activeProducts}
            activeIndex={activeIndex}
            gyroData={gyroData}
            onModelLoaded={onModelLoaded}
          />
        )}

        {enableEffects && <BackgroundParticles gyroData={gyroData} />}
        {/* {enableEffects && <SteamEffect />} */}

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