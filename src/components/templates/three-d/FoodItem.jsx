"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, PresentationControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- SETTINGS ---
const X_SPACING = 4.0;
const VISIBLE_RANGE = 1;
const RENDER_WINDOW = 2;
const ITEM_SCALE_ACTIVE = 10;
const ITEM_SCALE_SIDE = 6;
// How much the object tilts when phone moves (lower = less sensitivity)
const GYRO_INTENSITY = 40;

// --- 1. Real Model Component ---
function RealModel({ url }) {
  if (!url) return null;

  const { scene } = useGLTF(url);

  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material) {
          obj.material.envMapIntensity = 1.2;
          obj.material.roughness = 0.4;
          obj.material.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);

  return <primitive object={clone} />;
}

// --- 2. Placeholder Mesh ---
function PlaceholderMesh() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#333" wireframe opacity={0.2} transparent />
    </mesh>
  );
}

// --- 3. Main Component ---
export default function FoodItem({
  product,
  index,
  activeIndex,
  categoryMounted,
}) {
  const group = useRef();
  const modelRef = useRef();

  // Reference to store gyroscope data without causing re-renders
  const gyro = useRef({ x: 0, y: 0 });

  // Guard Clause
  if (!product) return null;

  const isActive = index === activeIndex;
  const offset = index - activeIndex;
  const absOffset = Math.abs(offset);

  const shouldLoadModel = absOffset <= VISIBLE_RANGE;
  const isVisible = absOffset <= RENDER_WINDOW;

  // --- NEW: Lightweight Gyroscope Listener ---
  useEffect(() => {
    // Function to handle device orientation
    const handleOrientation = (event) => {
      // beta: front/back tilt [-180, 180]
      // gamma: left/right tilt [-90, 90]
      const x = (event.beta || 0) / GYRO_INTENSITY;
      const y = (event.gamma || 0) / GYRO_INTENSITY;

      gyro.current = { x, y };
    };

    // Check if window is defined (SSR safety)
    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;

    // --- A. Position Movement ---
    const targetX = offset * X_SPACING;
    const targetZ = -Math.abs(offset) * 3;
    const targetY = categoryMounted ? -1 : -12;
    easing.damp3(
      group.current.position,
      [targetX, targetY, targetZ],
      0.3,
      delta
    );

    // --- B. Rotation & Scale Management ---
    // Get current gyro values
    const gyroX = gyro.current.x;
    const gyroY = gyro.current.y;

    if (isActive) {
      // Scale logic
      const targetScale = ITEM_SCALE_ACTIVE;
      const currentScale = group.current.scale.x;
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(currentScale, targetScale, delta * 5)
      );

      // Rotation logic + Gyro effect
      // Added gyroX and gyroY to the target rotation
      easing.dampE(
        group.current.rotation,
        [gyroX, gyroY, 0], // Tilt based on phone movement
        0.4,
        delta
      );
    } else {
      // Inactive logic
      const targetScale = ITEM_SCALE_SIDE;
      const currentScale = group.current.scale.x;
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(currentScale, targetScale, delta * 5)
      );

      // Rotation logic + Gyro effect (mixing with offset rotation)
      easing.dampE(
        group.current.rotation,
        [gyroX, offset * -0.2 + gyroY, 0], // Combine offset tilt + phone tilt
        0.4,
        delta
      );

      // Reset user interaction rotation
      if (modelRef.current) {
        easing.dampE(modelRef.current.rotation, [0, 0, 0], 0.5, delta);
      }
    }
  });

  if (!isVisible) return null;

  const content = (
    <group ref={modelRef}>
      {product?.model_url && shouldLoadModel ? (
        <RealModel url={product.model_url} index={index} />
      ) : (
        <PlaceholderMesh />
      )}
    </group>
  );

  return (
    <group ref={group}>
      <PresentationControls
        enabled={isActive}
        global={false}
        cursor={isActive}
        config={{ mass: 2, tension: 200 }}
        snap={false}
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Infinity, Infinity]}
      >
        <Float
          speed={isActive ? 1 : 0}
          rotationIntensity={isActive ? 0.2 : 0}
          floatIntensity={isActive ? 0.5 : 0}
        >
          {content}
        </Float>
      </PresentationControls>
    </group>
  );
}
