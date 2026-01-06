'use client'
import { Canvas } from '@react-three/fiber'
import { MapControls, OrthographicCamera, Text, Environment, TransformControls } from '@react-three/drei'
import { useState, useEffect } from 'react'
import * as THREE from 'three'

function TableBox({ id, position, width = 1.2, depth = 1.2, tableNumber, status, isEditing, onSelect, isSelected }) {
  const [hovered, setHovered] = useState(false)
  
  // Logic for color: Orange for occupied, Green for payment, White for free
  let baseColor = '#ffffff'
  if (status === 'ordering') baseColor = '#f97316' // Orange
  if (status === 'waiting_payment') baseColor = '#22c55e' // Green
  if (hovered && status === 'free') baseColor = '#e5e7eb' // Gray hover
  
  // In editing mode, if selected, use distinct blue
  if (isEditing && isSelected) baseColor = '#3b82f6' // Blue selected

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          if (isEditing) {
              onSelect(id)
          } else {
              console.log('Open table details for:', id)
              // Open order modal here
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Table Body */}
        <boxGeometry args={[width, 0.8, depth]} /> {/* Dynamic Dimensions */}
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
        
        {/* Table Number Text */}
        <Text
          position={[0, 1, 0]}
          fontSize={Math.min(width, depth) * 0.4} // Scale font with table
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {tableNumber}
        </Text>
      </mesh>

      {/* Soft Shadow / Floor Plane */}
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

function SceneContent({ tables, isEditing, onLayoutChange }) {
    const [selectedTableId, setSelectedTableId] = useState(null)
    const [localTables, setLocalTables] = useState(tables)

    // Update local tables when props change
    useEffect(() => {
        setLocalTables(tables)
    }, [tables])

    const handleTransformEnd = (e) => {
        if (!e.target.object) return
        
        const object = e.target.object
        const position = object.position
        
        // Convert back to DB coordinates (multiply by 10)
        const newX = position.x * 10
        const newY = position.z * 10
        
        // Find which table this object belongs to via selectedTableId
        // This is tricky with TransformControls as it wraps the object.
        // Better strategy: We can't easily attach TransformControls to a group inside a map loop directly strictly easily.
        // Standard way: Render TransformControls IMPERATIVELY or conditionally.
        
        // Actually simpler:
        // Update local state and notify parent
        const updatedTables = localTables.map(t => {
            if (t.id === selectedTableId) {
                return { ...t, x: newX, y: newY }
            }
            return t
        })
        
        setLocalTables(updatedTables)
        onLayoutChange(updatedTables)
    }

    return (
        <>
            {localTables.map((table) => (
                <group key={table.id}>
                    {/* If this is the selected table in edit mode, wrap/attach TransformControls */}
                    {isEditing && selectedTableId === table.id ? (
                        <TransformControls 
                             mode="translate" 
                             translationSnap={1} // Snap to grid
                             onMouseUp={handleTransformEnd} 
                             // Lock Y axis (height)
                             showY={false}
                        >
                             <TableBox 
                                id={table.id}
                                position={[table.x / 10, 0.4, table.y / 10]} 
                                width={table.width} 
                                depth={table.depth}
                                tableNumber={table.table_number}
                                status={table.status}
                                isEditing={isEditing}
                                onSelect={setSelectedTableId}
                                isSelected={true}
                            />
                        </TransformControls>
                    ) : (
                        <TableBox 
                            id={table.id}
                            position={[table.x / 10, 0.4, table.y / 10]} 
                            width={table.width} 
                            depth={table.depth}
                            tableNumber={table.table_number}
                            status={table.status}
                            isEditing={isEditing}
                            onSelect={setSelectedTableId}
                            isSelected={false}
                        />
                    )}
                </group>
            ))}
        </>
    )
}

export default function RestaurantMap({ tables, isEditing = false, onLayoutChange = () => {} }) {
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
      <SceneContent tables={tables} isEditing={isEditing} onLayoutChange={onLayoutChange} />

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