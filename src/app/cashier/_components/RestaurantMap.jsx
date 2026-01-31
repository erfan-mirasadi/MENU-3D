'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { MapControls, Environment, RoundedBox, useCursor, Html } from '@react-three/drei' // Removed PerspectiveCamera, Text, useTexture
import { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { MapCamera, MapFloor, TableVisual, getFloorColor } from './MapShared'
import { useRestaurantFeatures } from '@/app/hooks/useRestaurantFeatures'
import { FaFileInvoiceDollar } from 'react-icons/fa' // Added Icon

// Minimalist Avatar Component
function CustomerAvatar({ position, color }) {
    const group = useRef()
    
    // Subtle breathing animation
    useFrame((state) => {
        if (group.current) {
            // Bob up and down slightly
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
        }
    })

    return (
        <group ref={group} position={position}>
            {/* Body (Cone/Pawn shape) - Larger */}
            <mesh position={[0, -0.2, 0]}>
                {/* 
                   SCALE SETTINGS: 
                   args={[Top Radius, Bottom Radius, Height, Segments]} 
                   Increase first 3 numbers to make body bigger 
                */}
                <cylinderGeometry args={[0.1, 0.4, 0.8, 16]} />
                <meshStandardMaterial color={color} roughness={0.3} />
            </mesh>
            {/* Head - Larger */}
            <mesh position={[0, 0.2, 0]}>
                {/* 
                   SCALE SETTINGS: 
                   args={[Radius, Width Segments, Height Segments]} 
                   Increase first number (0.16) to make head bigger
                */}
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial color={color} roughness={0.3} />
            </mesh>
        </group>
    )
}

function TableBox({ id, position, width = 2.2, depth = 2.2, tableNumber, status, isEditing, onSelect, isSelected, session, active_orders, features }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'grab') 
  const materialRef = useRef()
  
  // Guest Count Logic (Active Orders based)
  const activeGuestCount = useMemo(() => {
     if (!active_orders || !Array.isArray(active_orders)) return 0
     const uniqueGuests = new Set(active_orders.map(o => o.added_by_guest_id).filter(Boolean))
     return uniqueGuests.size
  }, [active_orders])


  const getBaseColor = (s) => {
      if (s === 'ordered') return '#f97316' // Orange
      if (s === 'active' || s === 'confirmed') return '#22c55e' // Green
      if (s === 'payment_requested' || s === 'waiting_payment') return '#3b82f6' // BLUE 
      if (s === 'source') return '#6b7280' // Gray
      if (s === 'merge_target') return '#ea580c' // Dark Orange
      if (s === 'move_target') return '#16a34a' // Green
      return '#FDFBF7' // Creamy White
  }
  
  useEffect(() => {
     if(materialRef.current) {
        materialRef.current.color.set(getBaseColor(status))
     }
  }, [status])

  useFrame((state) => {
      if (!materialRef.current) return

      const time = state.clock.getElapsedTime()

      if (status === 'confirmed' || (status === 'kitchen_sent' && features && !features.waiter)) {
          // Orange Pulse / Blink 
          // 1. Standard: "Confirmed" means waiter approved, waiting for kitchen.
          // 2. No Waiter Mode: "Ordering" means customer placed order, waiting for Cashier/Kitchen (Direct Alert).
          const intensity = 0.5 + Math.sin(time * 8) * 0.5 // Fast blink
          materialRef.current.emissive.set('#f97316')
          materialRef.current.emissiveIntensity = intensity * 0.8
          materialRef.current.color.set('#f97316')
      } 
      else if (status === 'preparing') {
          // Chef Cooking -> Yellow Pulse
          const intensity = 0.5 + Math.sin(time * 3) * 0.3
          materialRef.current.emissive.set('#eab308') // Yellow-500
          materialRef.current.emissiveIntensity = intensity
          materialRef.current.color.set('#facc15') // Yellow-400
      }
      else if (status === 'active' || status === 'served') {
          // Green Glow (Steady Neon)
          materialRef.current.emissive.set('#22c55e')
          materialRef.current.emissiveIntensity = 0.5
          materialRef.current.color.set('#22c55e')
      }
      else if (status === 'payment_requested') {
          // Blue Blink (Bill Request) - CHANGED from Red Static
          const intensity = 0.5 + Math.sin(time * 10) * 0.5 // Very Fast Blink
          materialRef.current.emissive.set('#3b82f6')
          materialRef.current.emissiveIntensity = intensity
          materialRef.current.color.set('#3b82f6')
      }
       else if (status === 'ordering' || status === 'kitchen_sent') {
          // Sent to Kitchen -> Solid Orange
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

  // Poufs Generation
  const poufs = useMemo(() => {
        // Dynamic positioning based on activeGuestCount
        if (activeGuestCount === 0) return []

        const offset = 0.3 
        // Define available slots (start with 4 standard, can expand if needed but 4 is usually max for these tables visually)
        const slots = [
            [width / 2 + offset, 0.25, 0],   // Right
            [-width / 2 - offset, 0.25, 0],  // Left
            [0, 0.25, depth / 2 + offset],   // Bottom
            [0, 0.25, -depth / 2 - offset]   // Top
        ]
        
        return slots.slice(0, Math.min(activeGuestCount, 4)).map((pos) => ({
            pos,
            color: '#2d303e' // Brand Accent Color
        }))
  }, [width, depth, activeGuestCount])

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
         {/* SHARED TABLE VISUAL */}
         <TableVisual 
            width={width} 
            depth={depth} 
            tableNumber={tableNumber} 
            materialRef={materialRef} // Pass ref for color animation
         />
      </mesh>

      {/* BILL REQUEST ICON */}
      {status === 'payment_requested' && (
          <Html position={[1.1, 0.4, -1.2]} transform sprite scale={0.5}>
              <div 
                className="bg-[#2d303e]/40 text-white p-2 rounded-2xl shadow-xl shadow-orange-500/30 animate-bounce cursor-pointer flex items-center justify-center border border-white/50 backdrop-blur-md"
                style={{ width: '50px', height: '50px' }}
                onClick={(e) => {
                    e.stopPropagation() // Prevent table click
                }}
              >
                  <FaFileInvoiceDollar size={28} />
              </div>
          </Html>
      )}

      {/* Customer Avatars (Meeples) */}
      {poufs.map((pouf, i) => (
            <CustomerAvatar key={i} position={pouf.pos} color={pouf.color} />
      ))}

      {/* Soft Shadow (Offset for angled feel) */}
      <mesh position={[0.15, -0.39, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 0.4, depth + 0.4]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.1} 
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function SceneContent({ tables, isEditing, onSelectTable, features }) {
    const [localTables, setLocalTables] = useState(tables)

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
                    session={table.session}
                    active_orders={table.active_orders}
                    features={features}
                />
            ))}
        </>
    )
}

// Constraint Logic Hook
function MapBoundaries({ controlsRef }) {
    useFrame(() => {
        if (controlsRef.current) {
            const controls = controlsRef.current
            const camera = controls.object
            const target = controls.target
            const LIMIT = 30

            // Clamp Target (Center of rotation)
            const clampedX = Math.max(-LIMIT, Math.min(LIMIT, target.x))
            const clampedZ = Math.max(-LIMIT, Math.min(LIMIT, target.z))

            const deltaX = clampedX - target.x
            const deltaZ = clampedZ - target.z

            // If out of bounds, push camera and target back together
            if (deltaX !== 0 || deltaZ !== 0) {
                target.x = clampedX
                target.z = clampedZ
                camera.position.x += deltaX
                camera.position.z += deltaZ
            }
        }
    })
    return null
}

export default function RestaurantMap({ tables, isEditing = false, onSelectTable = () => {}, floorType = 'terrazzo' }) {
  const floorColor = getFloorColor(floorType)
  const controlsRef = useRef()
  const { features } = useRestaurantFeatures()

  return (
    <Canvas shadows dpr={[1, 2]} className="active:cursor-grabbing">
      <color attach="background" args={[floorColor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Environment preset="warehouse" />

      {/* Shared Perspective Camera */}
      <MapCamera />
      
      <MapControls 
        ref={controlsRef}
        makeDefault
        enableRotate={false}
        enableZoom={true}
        minDistance={70} // Minimum zoom (closest)
        maxDistance={200} // Maximum zoom (farthest) - prevents going too far out
        maxPolarAngle={Math.PI / 2.2} // Prevent going below ground
        dampingFactor={0.05}
        enabled={!isEditing} 
      />

      {/* Render Tables */}
      <SceneContent tables={tables} isEditing={isEditing} onSelectTable={onSelectTable} features={features} />

      {/* Boundaries Enforcer */}
      <MapBoundaries controlsRef={controlsRef} />

      {/* Shared Floor */}
      <MapFloor textureType={floorType} />
      
      {/* Grid (Subtle) */}
      <gridHelper args={[1000, 50, '#e5e7eb', '#e5e7eb']} position={[0, -0.38, 0]} />
    </Canvas>
  )
}