'use client'
import { Canvas } from '@react-three/fiber'
import { MapControls, OrthographicCamera, Text, Environment, useCursor } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

// Add useFrame to imports
import { useFrame } from '@react-three/fiber'

function TableBox({ id, position, width = 2.2, depth = 2.2, tableNumber, status, isEditing, onSelect, isSelected }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'auto')
  const materialRef = useRef()
  
  // Logic for color mapping
  // Statuses: 'free' | 'ordered' | 'active' | 'payment_requested'
  // DB might use different strings, so we normalize or handle multiple cases.
  
  const getBaseColor = (s) => {
      if (s === 'ordered') return '#f97316' // Orange
      if (s === 'active' || s === 'confirmed') return '#22c55e' // Green
      if (s === 'payment_requested' || s === 'waiting_payment') return '#ef4444' // Red
      // Transfer Mode Colors
      if (s === 'source') return '#6b7280' // Gray
      if (s === 'merge_target') return '#ea580c' // Dark Orange
      if (s === 'move_target') return '#16a34a' // Green
      return '#ffffff' // free
  }
  
  useEffect(() => {
     if(materialRef.current) {
        // Set initial color state mostly for static references
        // Animation loop will override for active states
        materialRef.current.color.set(getBaseColor(status))
     }
  }, [status])

  useFrame((state) => {
      if (!materialRef.current) return

      const time = state.clock.getElapsedTime()
      
      if (status === 'confirmed') {
          // Orange Pulse / Blink (User Request: "vaqti garson taeid kone... cheshmak narenji")
          const intensity = 0.5 + Math.sin(time * 8) * 0.5 // Fast blink
          materialRef.current.emissive.set('#f97316')
          materialRef.current.emissiveIntensity = intensity * 0.8
          materialRef.current.color.set('#f97316')
      } 
      else if (status === 'active' || status === 'preparing' || status === 'served') {
          // Green Glow (Steady Neon)
          materialRef.current.emissive.set('#22c55e')
          materialRef.current.emissiveIntensity = 0.5
          materialRef.current.color.set('#22c55e')
      }
      else if (status === 'payment_requested') {
          // Red Glow (Bill Request)
          materialRef.current.emissive.set('#ef4444')
          materialRef.current.emissiveIntensity = 0.6
          materialRef.current.color.set('#ef4444')
      }
       else if (status === 'ordering') {
          // Pending Waiter Approval - Maybe softer orange, no blink?
          materialRef.current.emissive.set('#f97316')
          materialRef.current.emissiveIntensity = 0.2
          materialRef.current.color.set('#fdba74') 
      }
      else if (status === 'occupied') {
          // Seated but nothing ordered - Blueish
           materialRef.current.emissive.set('#3b82f6')
           materialRef.current.emissiveIntensity = 0.2
           materialRef.current.color.set('#93c5fd')
      }
      // --- TRANSFER MODES ---
      else if (status === 'source') {
           materialRef.current.emissive.set('#000000')
           materialRef.current.emissiveIntensity = 0
           materialRef.current.color.set('#374151') // Gray 700
           materialRef.current.transparent = true
           materialRef.current.opacity = 0.5
      }
      else if (status === 'merge_target') {
           const intensity = 0.5 + Math.sin(time * 10) * 0.5 
           materialRef.current.emissive.set('#ea580c')
           materialRef.current.emissiveIntensity = intensity
           materialRef.current.color.set('#ea580c')
      }
      else if (status === 'move_target') {
           const intensity = 0.5 + Math.sin(time * 5) * 0.5 
           materialRef.current.emissive.set('#16a34a')
           materialRef.current.emissiveIntensity = intensity
           materialRef.current.color.set('#16a34a')
      }
      else {
          // Free / Default
           materialRef.current.emissiveIntensity = 0
           materialRef.current.transparent = false
           materialRef.current.opacity = 1
           const targetColor = (isEditing && isSelected) ? '#3b82f6' : 
                               (hovered ? '#e5e7eb' : '#ffffff')
           materialRef.current.color.set(targetColor)
      }
  })

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          if (isEditing) {
              onSelect(id)
          } else {
              if (onSelect) onSelect(id)
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Table Body */}
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial 
            ref={materialRef}
            roughness={0.2} 
            metalness={0.1} 
        />
        
        {/* Table Number Text - Engraved Look */}
        <Text
          position={[0, 0.41, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          fontSize={Math.min(width, depth) * 0.35} 
          maxWidth={width * 0.8} 
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color="#1f2937" 
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.9}
          letterSpacing={-0.05}
        >
          {tableNumber}
        </Text>
      </mesh>

      {/* Soft Shadow */}
      <mesh position={[0, -0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 0.4, depth + 0.4]} />
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

function SceneContent({ tables, isEditing, onSelectTable }) {
    const [localTables, setLocalTables] = useState(tables)

    // Update local tables when props change
    useEffect(() => {
        setLocalTables(tables)
    }, [tables])

    return (
        <>
            {localTables.map((table) => (
                <TableBox 
                    key={table.id}
                    id={table.id}
                    position={[table.x / 10, 0.4, table.y / 10]} 
                    width={table.width} 
                    depth={table.depth}
                    tableNumber={table.table_number}
                    status={table.status}
                    isEditing={isEditing}
                    onSelect={onSelectTable}
                    isSelected={false}
                />
            ))}
        </>
    )
}

export default function RestaurantMap({ tables, isEditing = false, onSelectTable = () => {} }) {
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
        // Disable map controls when dragging an object (TransformControls will handle this automatically usually, but good to know)
        enabled={!isEditing} 
      />

      {/* ۳. رندر کردن میزهای واقعی */}
      <SceneContent tables={tables} isEditing={isEditing} onSelectTable={onSelectTable} />

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