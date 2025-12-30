"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  Suspense,
  useLayoutEffect,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, PresentationControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- SETTINGS ---
const X_SPACING = 4.0;
const VISIBLE_RANGE = 1;
const RENDER_WINDOW = 2;
const ITEM_SCALE_ACTIVE = 11;
const ITEM_SCALE_SIDE = 6;

// --- GLOBAL CACHE TRACKER ---
const loadedUrls = new Set();

// --- COMPONENT: REAL MODEL ---
function RealModel({ url, productTitle, onLoad }) {
  const { scene } = useGLTF(url);
  const hasLogged = useRef(false);

  // Trigger onLoad when the model is mounted (rendered)
  useLayoutEffect(() => {
    if (onLoad) onLoad();

    if (!hasLogged.current) {
      hasLogged.current = true;
      const isCached = loadedUrls.has(url);
      if (isCached) {
        console.log(
          `%c ⚡ FROM CACHE: ${productTitle}`,
          "color: #00ffff; font-weight: bold;"
        );
      } else {
        console.log(
          `%c 📥 DOWNLOADING: ${productTitle}`,
          "color: #ff00ff; font-weight: bold;"
        );
        loadedUrls.add(url);
      }
    }
  }, [url, onLoad, productTitle]);

  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material) {
          obj.material.envMapIntensity = 1.0;
          obj.material.roughness = 0.5;
          obj.material.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);

  return <primitive object={clone} />;
}

// --- COMPONENT: PLACEHOLDER ---
function PlaceholderMesh() {
  return (
    <mesh>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#444" wireframe opacity={0.2} transparent />
    </mesh>
  );
}

// --- MAIN COMPONENT ---
export default function FoodItem({
  product,
  index,
  activeIndex,
  gyroData,
  onLoad,
}) {
  const group = useRef();
  const modelRef = useRef();

  // Edge Case: If product has no model, trigger onLoad immediately to avoid stuck loader
  useEffect(() => {
    if (product && !product.model_url && onLoad) {
      onLoad();
    }
  }, [product, onLoad]);

  if (!product) return null;

  const isActive = index === activeIndex;
  const offset = index - activeIndex;
  const absOffset = Math.abs(offset);
  const shouldLoadModel = absOffset <= VISIBLE_RANGE;
  const isVisible = absOffset <= RENDER_WINDOW;

  useFrame((state, delta) => {
    if (!group.current) return;

    // A. Position Logic
    const targetX = offset * X_SPACING;
    const targetZ = -Math.abs(offset) * 3;
    const targetY = -1;

    easing.damp3(
      group.current.position,
      [targetX, targetY, targetZ],
      0.6,
      delta
    );

    // B. Rotation Logic
    const gyroX = gyroData.x;
    const gyroY = gyroData.y;

    if (isActive) {
      const currentScale = group.current.scale.x;
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(currentScale, ITEM_SCALE_ACTIVE, delta * 6)
      );
      easing.dampE(group.current.rotation, [gyroX, gyroY, 0], 0.4, delta);
    } else {
      const currentScale = group.current.scale.x;
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(currentScale, ITEM_SCALE_SIDE, delta * 6)
      );
      easing.dampE(
        group.current.rotation,
        [gyroX, offset * -0.2 + gyroY, 0],
        0.4,
        delta
      );
      if (modelRef.current) {
        easing.dampE(modelRef.current.rotation, [0, 0, 0], 0.5, delta);
      }
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={group}>
      <PresentationControls
        enabled={isActive}
        global={false}
        cursor={isActive}
        config={{ mass: 2, tension: 250, friction: 20 }}
        snap={false}
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Infinity, Infinity]}
      >
        <Float
          speed={isActive ? 1.5 : 0}
          rotationIntensity={isActive ? 0.2 : 0}
          floatIntensity={isActive ? 0.5 : 0}
        >
          <group ref={modelRef}>
            <Suspense fallback={<PlaceholderMesh />}>
              {product?.model_url && shouldLoadModel && (
                <RealModel
                  url={product.model_url}
                  productTitle={product.title?.en || `Item ${index}`}
                  // Trigger loading complete ONLY if this is the active item
                  onLoad={isActive ? onLoad : undefined}
                />
              )}
            </Suspense>

            {!product.model_url && <PlaceholderMesh />}
          </group>
        </Float>
      </PresentationControls>
    </group>
  );
}
