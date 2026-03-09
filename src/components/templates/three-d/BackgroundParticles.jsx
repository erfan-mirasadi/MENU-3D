"use client";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const pseudoRandom = (seed) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
};

const CONFIG = {
  // appearance settings
  COUNT: 150, // number of particles (for mobile up to 500 is okay)
  COLOR: "#ffffff", // particle color
  OPACITY: 0.6, // transparency (0.0 to 1.0)
  SIZE: 0.06, // base size of each particle

  // spread settings
  SPREAD_FACTOR: 1.2, // particles in what space to spread? (2.0 means twice the screen size)
  DEPTH: 15, // scene depth (the more, the greater the distance between particles in front and back)

  //  floating settings
  FLOAT_SPEED: 0.1, // automatic up and down speed (the less, the slower)
  FLOAT_AMPLITUDE: 0.4, // range of motion (how much to go up and down?)

  //  touch interaction settings
  TOUCH_SMOOTHNESS: 0.03, // touch movement smoothness (the less, the more slippery and delayed)
  TOUCH_RADIUS: 3, // touch radius (how far to affect?)
  TOUCH_STRENGTH: 0.05, // push strength (the more, the more particles escape)

  //  phone sensor settings
  SENSOR_STRENGTH: 0.3, // movement strength with phone shake
};

export default function BackgroundParticles({ gyroData }) {
  const pointsRef = useRef();
  const smoothTouch = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const { positions, randoms, initialPositions } = useMemo(() => {
    const pos = new Float32Array(CONFIG.COUNT * 3);
    const initPos = new Float32Array(CONFIG.COUNT * 3);
    const rnd = new Float32Array(CONFIG.COUNT * 3);
    const baseSeed = viewport.width * 1000 + viewport.height * 100;

    for (let i = 0; i < CONFIG.COUNT; i++) {
      const i3 = i * 3;
      const rx = pseudoRandom(baseSeed + i3 + 1);
      const ry = pseudoRandom(baseSeed + i3 + 2);
      const rz = pseudoRandom(baseSeed + i3 + 3);

      // spread based on SPREAD_FACTOR
      const x = (rx - 0.5) * viewport.width * CONFIG.SPREAD_FACTOR;
      const y = (ry - 0.5) * viewport.height * CONFIG.SPREAD_FACTOR;
      const z = (rz - 0.5) * CONFIG.DEPTH - 5;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      initPos[i3] = x;
      initPos[i3 + 1] = y;
      initPos[i3 + 2] = z;

      // random numbers for movement variety
      rnd[i3] = pseudoRandom(baseSeed + i3 + 11);
      rnd[i3 + 1] = pseudoRandom(baseSeed + i3 + 12);
      rnd[i3 + 2] = pseudoRandom(baseSeed + i3 + 13);
    }
    return { positions: pos, initialPositions: initPos, randoms: rnd };
  }, [viewport.width, viewport.height]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position;

    // smooth touch
    const targetX = state.pointer.x * (viewport.width / 2);
    const targetY = state.pointer.y * (viewport.height / 2);

    smoothTouch.current.x = THREE.MathUtils.lerp(
      smoothTouch.current.x,
      targetX,
      CONFIG.TOUCH_SMOOTHNESS,
    );
    smoothTouch.current.y = THREE.MathUtils.lerp(
      smoothTouch.current.y,
      targetY,
      CONFIG.TOUCH_SMOOTHNESS,
    );

    // sensor offset
    const sensorOffsetX = (gyroData?.y || 0) * CONFIG.SENSOR_STRENGTH;
    const sensorOffsetY = (gyroData?.x || 0) * CONFIG.SENSOR_STRENGTH;

    // update particles
    for (let i = 0; i < CONFIG.COUNT; i++) {
      const i3 = i * 3;

      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      const speed = CONFIG.FLOAT_SPEED + randoms[i3] * 0.4; // speed variation
      const phase = randoms[i3 + 2] * 10;

      // Floating
      const floatX = Math.sin(time * speed + phase) * CONFIG.FLOAT_AMPLITUDE;
      const floatY =
        Math.cos(time * speed * 0.7 + phase) * CONFIG.FLOAT_AMPLITUDE;

      // Touch Repulsion
      const dx = ix - smoothTouch.current.x;
      const dy = iy - smoothTouch.current.y;
      const distSq = dx * dx + dy * dy;

      let pushX = 0;
      let pushY = 0;

      if (distSq < CONFIG.TOUCH_RADIUS) {
        // closer = stronger
        const force = (CONFIG.TOUCH_RADIUS - distSq) * CONFIG.TOUCH_STRENGTH;
        pushX = dx * force;
        pushY = dy * force;
      }

      // final position
      positionsAttr.array[i3] = ix + floatX - sensorOffsetX + pushX;
      positionsAttr.array[i3 + 1] = iy + floatY + sensorOffsetY + pushY;

      // twinkle
      positionsAttr.array[i3 + 2] = iz + Math.sin(time * 1.5 + phase) * 0.8;
    }

    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={CONFIG.SIZE}
        color={CONFIG.COLOR}
        transparent
        opacity={CONFIG.OPACITY}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
