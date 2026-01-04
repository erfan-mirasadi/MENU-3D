"use client";

import {
  useRef,
  useMemo,
  useEffect,
  useState,
  Suspense,
  useLayoutEffect,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { PresentationControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- IMPORTS ---
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

// --- SETTINGS ---
const X_SPACING = 4.0;
const VISIBLE_RANGE = 1;
const RENDER_WINDOW = 2;
const ITEM_SCALE_ACTIVE = 11;
const ITEM_SCALE_SIDE = 6;
// --- COMPONENT: REAL MODEL ---
// --- CACHE ---
const gltfCache = new Map();

// --- SINGLETONS ---
let ktx2Loader = null;
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

// --- COMPONENT: REAL MODEL ---
function RealModel({ url, productTitle, onLoad }) {
  const gl = useThree((state) => state.gl);
  const [scene, setScene] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Check Cache
    if (gltfCache.has(url)) {
      console.log(`⚡ FROM CACHE: ${productTitle}`);
      setScene(gltfCache.get(url));
      return;
    }

    console.log(`⬇️ DOWNLOADING: ${productTitle}`);

    // 2. Initialize Singletons 
    if (!ktx2Loader) {
      ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/libs/basis/');
      ktx2Loader.detectSupport(gl);
    }

    // 3. Create Loader
    const loader = new GLTFLoader();

    if (MeshoptDecoder) {
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
    loader.setKTX2Loader(ktx2Loader);
    loader.setDRACOLoader(dracoLoader);

    // 4. Load
    loader.load(
      url,
      (gltf) => {
        if (!isMounted) return;
        gltfCache.set(url, gltf.scene); // Store raw scene
        setScene(gltf.scene);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.error(`❌ Error loading ${productTitle}:`, err);
        setError(err);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url, gl, productTitle]);

  // Handle Side Effects (Scene Prep)
  useLayoutEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  const clone = useMemo(() => {
    if (!scene) return null;
    const c = scene.clone();
    c.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material) {
          if (obj.material.map) obj.material.map.needsUpdate = true;
          obj.material.envMapIntensity = 1.0;
          obj.material.roughness = 0.5;
          obj.material.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);

  if (error) return <PlaceholderMesh />;
  if (!clone) return <PlaceholderMesh />;

  return <primitive object={clone} />;
}

// ... (PlaceholderMesh and FoodItem same as before) ...
function PlaceholderMesh() {
  return (
    <mesh>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#444" wireframe opacity={0.2} transparent />
    </mesh>
  );
}

export default function FoodItem({
  product,
  index,
  activeIndex,
  gyroData,
  onLoad,
}) {
  const group = useRef();
  const modelRef = useRef();

  useEffect(() => {
    if (product && !product.model_url && !product.cached_model_url && onLoad) {
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
    const targetX = offset * X_SPACING;
    const targetZ = -Math.abs(offset) * 3;
    const targetY = -1;
    easing.damp3(group.current.position, [targetX, targetY, targetZ], 0.6, delta);

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
      easing.dampE(group.current.rotation, [gyroX, offset * -0.2 + gyroY, 0], 0.4, delta);
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
        <Float speed={isActive ? 1.5 : 0} rotationIntensity={isActive ? 0.2 : 0} floatIntensity={isActive ? 0.5 : 0}>
          <group ref={modelRef}>
            <Suspense fallback={<PlaceholderMesh />}>
              {(product?.model_url || product?.cached_model_url) && shouldLoadModel && (
                <RealModel
                  url={product.cached_model_url || product.model_url}
                  productTitle={product.title?.en || `Item ${index}`}
                  onLoad={isActive ? onLoad : undefined}
                />
              )}
            </Suspense>
            {!product.model_url && !product.cached_model_url && <PlaceholderMesh />}
          </group>
        </Float>
      </PresentationControls>
    </group>
  );
}