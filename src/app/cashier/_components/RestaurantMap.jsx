'use client'
import { Canvas } from '@react-three/fiber'
import { MapControls, OrthographicCamera, Text, Environment } from '@react-three/drei'
import { useState } from 'react'
import * as THREE from 'three'

function TableBox({ id, position, tableNumber, status }) {
  const [hovered, setHovered] = useState(false)
  
  // لاجیک رنگ: نارنجی برای مشغول، سبز برای پرداخت، سفید برای خالی
  let baseColor = '#ffffff'
  if (status === 'ordering') baseColor = '#f97316' // Orange
  if (status === 'waiting_payment') baseColor = '#22c55e' // Green
  if (hovered && status === 'free') baseColor = '#e5e7eb' // Gray hover

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          console.log('Open table details for:', id)
          // اینجا مودال سفارش رو باز کن
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* بدنه میز */}
        <boxGeometry args={[1.2, 0.8, 1.2]} /> {/* ابعاد میز */}
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
        
        {/* متن شماره میز (بالای میز) */}
        <Text
          position={[0, 1, 0]}
          fontSize={0.5}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {tableNumber}
        </Text>
      </mesh>

      {/* سایه نرم زیر میز (برای زیبایی و عمق) */}
      <mesh position={[0, -0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.15} 
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default function RestaurantMap({ tables }) {
  return (
    <Canvas shadows dpr={[1, 2]}>
      {/* ۱. نورپردازی محیطی */}
      <color attach="background" args={['#f3f4f6']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <Environment preset="city" />

      {/* ۲. دوربین ایزومتریک */}
      <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={25} near={-100} far={200} />
      
      <MapControls 
        enableRotate={false} 
        enableZoom={true} 
        minZoom={10} 
        maxZoom={50}
        dampingFactor={0.05}
      />

      {/* ۳. رندر کردن میزهای واقعی */}
      {tables.map((table) => (
        <TableBox 
          key={table.id}
          id={table.id}
          // نکته کلیدی: تبدیل X,Y دیتابیس به X,Z فضای سه بعدی
          // تقسیم بر ۱۰ میکنیم که اسکیل مناسب باشه (بسته به عددی که تو دیتابیس ذخیره کردی)
          position={[table.x / 10, 0.4, table.y / 10]} 
          tableNumber={table.table_number}
          status={table.status}
        />
      ))}

      {/* ۴. کف زمین */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
      
      {/* گرید برای حس معماری (اختیاری) */}
      <gridHelper args={[1000, 50, '#e5e7eb', '#e5e7eb']} position={[0, -0.39, 0]} />
    </Canvas>
  )
}