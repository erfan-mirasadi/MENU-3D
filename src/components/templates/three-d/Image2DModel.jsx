"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function Image2DModel({ product, onLoad }) {
  const meshRef = useRef(null);

  // Determine which URLs we have
  const diffuseUrl = product?.image_url;
  const normalUrl = product?.normal_map_url;
  const aoUrl = product?.ambient_map_url;
  const roughnessUrl = product?.roughness_map_url;

  const appendCors = (url) => {
    if (!url) return null;
    return url + (url.includes("?") ? "&" : "?") + "r3f=1";
  };

  const texturesToLoad = useMemo(() => {
    const toLoad = {};
    if (diffuseUrl) toLoad.map = appendCors(diffuseUrl);
    if (normalUrl) toLoad.normalMap = appendCors(normalUrl);
    if (aoUrl) toLoad.aoMap = appendCors(aoUrl);
    if (roughnessUrl) toLoad.roughnessMap = appendCors(roughnessUrl);
    return toLoad;
  }, [diffuseUrl, normalUrl, aoUrl, roughnessUrl]);

  const loadedTextures = useTexture(texturesToLoad);

  // Notify parent that the model is loaded
  useEffect(() => {
    if (onLoad) onLoad();
  }, [onLoad]);

  // Set colorspaces correctly without mutating the cached hook result directly
  const processedTextures = useMemo(() => {
    const pt = {};
    if (loadedTextures.map) {
      pt.map = loadedTextures.map.clone();
      pt.map.colorSpace = THREE.SRGBColorSpace;
      pt.map.needsUpdate = true;
    }
    if (loadedTextures.normalMap) {
      pt.normalMap = loadedTextures.normalMap.clone();
      pt.normalMap.colorSpace = THREE.NoColorSpace;
      pt.normalMap.needsUpdate = true;
    }
    if (loadedTextures.aoMap) {
      pt.aoMap = loadedTextures.aoMap;
    }
    if (loadedTextures.roughnessMap) {
      pt.roughnessMap = loadedTextures.roughnessMap;
    }
    return pt;
  }, [loadedTextures]);

  // Calculate aspect ratio for the plane
  const aspect = useMemo(() => {
    if (!processedTextures.map) return 1;
    const { image } = processedTextures.map;
    if (image && image.width && image.height) {
      return image.width / image.height;
    }
    return 1;
  }, [processedTextures.map]);

  const planeWidth = 0.25;
  const planeHeight = planeWidth / aspect;

  const shouldUseFakeGlass = !!normalUrl && !roughnessUrl;

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.08, 0]}>
        <planeGeometry args={[planeWidth, planeHeight, 16, 16]} />

        <meshPhysicalMaterial
          map={processedTextures.map || undefined}
          color={processedTextures.map ? "#ffffff" : "#222222"}
          normalMap={processedTextures.normalMap || undefined}
          normalScale={
            processedTextures.normalMap
              ? new THREE.Vector2(1.5, 1.5)
              : new THREE.Vector2(0, 0)
          }
          roughnessMap={processedTextures.roughnessMap || undefined}
          roughness={processedTextures.roughnessMap ? 1 : 0.2}
          aoMap={processedTextures.aoMap || undefined}
          transparent={true}
          metalness={0.1}
          clearcoat={shouldUseFakeGlass ? 1.0 : 0.0}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
