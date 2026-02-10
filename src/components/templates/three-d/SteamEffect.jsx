"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- CONFIG ---
const PARTICLE_COUNT = 5;
const MAX_LIFE = 5.0; // Life of a single particle
const BASE_SPEED = 0.2;

// --- GLOBAL TEXTURE CACHE ---
let _smokeTexture = null;

function getSmokeTexture() {
    if (typeof document === "undefined") return null;
    if (_smokeTexture) return _smokeTexture;

    const size = 64; 
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );
    // Soft gradient
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); 
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    _smokeTexture = new THREE.CanvasTexture(canvas);
    _smokeTexture.colorSpace = THREE.SRGBColorSpace;
    return _smokeTexture;
}

// --- SHADERS ---
// Vertex shader handles size attenuation and hiding dead particles
const vertexShader = `
  attribute float aOpacity;
  attribute float aScale;
  varying float vOpacity;
  
  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Move off-screen if opacity is 0 (optimization)
    if (vOpacity <= 0.001) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0); 
    }
    
    gl_PointSize = aScale * (400.0 / -mvPosition.z); 
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  varying float vOpacity;
  
  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(texColor.rgb, texColor.a * vOpacity);
  }
`;

export default function SteamEffect() {
  const texture = useMemo(() => getSmokeTexture(), []);
  const pointsRef = useRef();

  // Simulation State
  // We use a ref to track the "Burst" cycle
  const simState = useRef({
      nextBurstTime: 0,
      active: false
  });

  const particles = useMemo(() => {
    return new Array(PARTICLE_COUNT).fill().map(() => ({
      // Spawn in a wider line/area so it's not a "dot" source
      spawnX: (Math.random() - 0.5) * 0.8, // Wider X
      spawnZ: (Math.random() - 0.5) * 0.2, // Narrow Z (flat)
      
      // Dynamic props
      x: 0, y: -10, z: 0, 
      
      life: MAX_LIFE + 1,
      // Longer delay spread: particles trickle in over 4 seconds
      delay: Math.random() * 4.0, 
      
      speed: 0.3 + Math.random() * 0.3, // Faster upward movement (was 0.15)
      scaleBase: 20.0 + Math.random() * 10.0, 
      driftOffset: Math.random() * 100, 
    }));
  }, []);

  const [positions, opacities, scales] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const ops = new Float32Array(PARTICLE_COUNT);
    const sca = new Float32Array(PARTICLE_COUNT);
    return [pos, ops, sca];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const sim = simState.current;

    // --- BURST CONTROLLER ---
    if (!sim.active && time > sim.nextBurstTime) {
        sim.active = true;
    }

    let activeParticles = 0;

    particles.forEach((p, i) => {
        // Reset Logic
        if (sim.active && p.life >= MAX_LIFE) {
             if (p.y <= -5) { 
                 p.life = -p.delay; 
                 p.x = p.spawnX;
                 p.y = 0;
                 p.z = p.spawnZ;
             }
        }

        p.life += delta;

        // VISUAL UPDATE
        if (p.life < 0) {
            opacities[i] = 0;
            activeParticles++; 
        } 
        else if (p.life < MAX_LIFE) {
            activeParticles++;
            
            p.y += p.speed * delta; // STRICTLY UP
            
            // Gentle drift
            const drift = Math.sin(time * 1.0 + p.driftOffset) * 0.1;
            const currentX = p.x + drift; // Drift doesn't depend on Y as much now
            
            positions[i * 3] = currentX;
            positions[i * 3 + 1] = p.y; // Moving UP
            positions[i * 3 + 2] = p.z; // Constant Z (no moving back)

            // Opacity & Scale
            const progress = p.life / MAX_LIFE;
            let opacity = 0;
            if (progress < 0.2) opacity = progress / 0.2;
            else opacity = 1 - ((progress - 0.2) / 0.8);
            
            opacities[i] = opacity * 0.5;
            scales[i] = p.scaleBase * (1.0 + progress * 0.5);
        } 
        else {
            opacities[i] = 0;
            p.y = -10; 
        }
    });

    if (sim.active && activeParticles === 0) {
        sim.active = false;
        sim.nextBurstTime = time + 1.5 + Math.random() * 3.0; // Shorter wait
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.aOpacity.needsUpdate = true;
    pointsRef.current.geometry.attributes.aScale.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <points ref={pointsRef} position={[0, -0.6, -0.5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          count={PARTICLE_COUNT}
          array={opacities}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={PARTICLE_COUNT}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTexture: { value: texture } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  );
}
