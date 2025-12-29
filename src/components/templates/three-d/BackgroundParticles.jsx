"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// --- 🎛️ تنظیمات کنترل ذرات ---
const CONFIG = {
  // 1. تنظیمات ظاهری
  COUNT: 150, // تعداد ذرات (برای موبایل تا 500 هم اوکیه)
  COLOR: "#ffffff", // رنگ ذرات
  OPACITY: 0.3, // شفافیت (0.0 تا 1.0)
  SIZE: 0.06, // اندازه پایه هر ذره

  // 2. تنظیمات پخش شدگی
  SPREAD_FACTOR: 1.3, // ذرات در چه فضایی پخش بشن؟ (2.0 یعنی دو برابر اندازه صفحه)
  DEPTH: 20, // عمق صحنه (هرچی بیشتر، فاصله ذرات جلو و عقب بیشتر میشه)

  // 3. تنظیمات شناوری (Floating)
  FLOAT_SPEED: 0.1, // سرعت بالا پایین رفتن خودکار (هرچی کمتر، آروم‌تر)
  FLOAT_AMPLITUDE: 0.4, // دامنه حرکت (چقدر بالا پایین برن؟)

  // 4. تنظیمات تعامل با تاچ (Touch)
  TOUCH_SMOOTHNESS: 0.03, // نرمی حرکت تاچ (هرچی کمتر، لیز خوردن بیشتر و با تاخیرتر)
  TOUCH_RADIUS: 3, // شعاع اثر انگشت (چقدر دورتر رو تحت تاثیر قرار بده؟)
  TOUCH_STRENGTH: 0.05, // قدرت هُل دادن (هرچی بیشتر، ذرات بیشتر فرار میکنن)

  // 5. تنظیمات سنسور گوشی
  SENSOR_STRENGTH: 0.5, // قدرت جابجایی با تکون دادن گوشی
};

export default function BackgroundParticles({ gyroData }) {
  const pointsRef = useRef();
  const smoothTouch = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  // --- ساختن ذرات ---
  const { positions, randoms, initialPositions } = useMemo(() => {
    const pos = new Float32Array(CONFIG.COUNT * 3);
    const initPos = new Float32Array(CONFIG.COUNT * 3);
    const rnd = new Float32Array(CONFIG.COUNT * 3);

    for (let i = 0; i < CONFIG.COUNT; i++) {
      // پخش کردن بر اساس SPREAD_FACTOR
      const x = (Math.random() - 0.5) * viewport.width * CONFIG.SPREAD_FACTOR;
      const y = (Math.random() - 0.5) * viewport.height * CONFIG.SPREAD_FACTOR;
      const z = (Math.random() - 0.5) * CONFIG.DEPTH - 5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      // اعداد رندوم برای تنوع حرکت
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return { positions: pos, initialPositions: initPos, randoms: rnd };
  }, [viewport.width, viewport.height]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position;

    // --- 1. نرم کردن تاچ ---
    const targetX = state.pointer.x * (viewport.width / 2);
    const targetY = state.pointer.y * (viewport.height / 2);

    smoothTouch.current.x = THREE.MathUtils.lerp(
      smoothTouch.current.x,
      targetX,
      CONFIG.TOUCH_SMOOTHNESS
    );
    smoothTouch.current.y = THREE.MathUtils.lerp(
      smoothTouch.current.y,
      targetY,
      CONFIG.TOUCH_SMOOTHNESS
    );

    // --- 2. آفست سنسور ---
    const sensorOffsetX = (gyroData?.y || 0) * CONFIG.SENSOR_STRENGTH;
    const sensorOffsetY = (gyroData?.x || 0) * CONFIG.SENSOR_STRENGTH;

    // --- 3. آپدیت تک‌تک ذرات ---
    for (let i = 0; i < CONFIG.COUNT; i++) {
      const i3 = i * 3;

      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      const speed = CONFIG.FLOAT_SPEED + randoms[i3] * 0.4; // تنوع سرعت
      const phase = randoms[i3 + 2] * 10;

      // A) حرکت شناور (Floating)
      const floatX = Math.sin(time * speed + phase) * CONFIG.FLOAT_AMPLITUDE;
      const floatY =
        Math.cos(time * speed * 0.7 + phase) * CONFIG.FLOAT_AMPLITUDE;

      // B) واکنش به تاچ (Repulsion)
      const dx = ix - smoothTouch.current.x;
      const dy = iy - smoothTouch.current.y;
      const distSq = dx * dx + dy * dy;

      let pushX = 0;
      let pushY = 0;

      if (distSq < CONFIG.TOUCH_RADIUS) {
        // هرچی نزدیک‌تر، قدرت بیشتر (بر اساس TOUCH_STRENGTH)
        const force = (CONFIG.TOUCH_RADIUS - distSq) * CONFIG.TOUCH_STRENGTH;
        pushX = dx * force;
        pushY = dy * force;
      }

      // C) اعمال پوزیشن نهایی
      positionsAttr.array[i3] = ix + floatX - sensorOffsetX + pushX;
      positionsAttr.array[i3 + 1] = iy + floatY + sensorOffsetY + pushY;

      // D) چشمک زدن (Twinkle)
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
