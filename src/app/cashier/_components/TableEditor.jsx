'use client'
import { Canvas, useThree } from '@react-three/fiber'
import { MapControls, OrthographicCamera, Environment, Text, useCursor } from '@react-three/drei'
import { useState, useRef, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import * as THREE from 'three'

/**
 * Resize Handle Component
 * Purely a visual trigger. Logic moved to SceneContent for stability.
 */
function ResizeHandle({ position, direction, onResizeStart }) {
    const [hovered, setHovered] = useState(false)
    
    let cursor = 'grab'
    if (direction.includes('x')) cursor = 'ew-resize'
    if (direction.includes('z')) cursor = 'ns-resize'
    
    useCursor(hovered, cursor, 'auto')

    return (
        <mesh
            position={position}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
            onPointerDown={(e) => {
                e.stopPropagation()
                // Just trigger start. Parent handles the global drag.
                // We pass the hit point on the handle as the start reference? 
                // Or better: Parent calculates start point from the Global Plane to be consistent.
                // But we need to hit the handle first.
                // Let's pass the event point.
                onResizeStart(direction, e.point)
            }}
        >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshBasicMaterial color={hovered ? "#f59e0b" : "#3b82f6"} />
        </mesh>
    )
}

/**
 * Scene Content
 * Handles the 3D scene, drag logic, and rendering.
 */
function SceneContent({ tables, onUpdate, selectedId, onSelect, mode = 'translate' }) {
    const orbitRef = useRef()
    const [draggingId, setDraggingId] = useState(null)
    const [dragStartOffset, setDragStartOffset] = useState([0,0])
    
    // Resize State
    const [resizingDirection, setResizingDirection] = useState(null)
    const [resizeStartPoint, setResizeStartPoint] = useState(null)
    const [initialResizeData, setInitialResizeData] = useState(null) // { w, d, x, y }

    // Highlight hovered table
    const [hoveredId, setHoveredId] = useState(null)
    useCursor(!!hoveredId && !draggingId && !resizingDirection, 'grab', 'auto')
    useCursor(!!draggingId || !!resizingDirection, 'grabbing', 'auto')

    // Disable OrbitControls when any interaction is active
    useEffect(() => {
        if (orbitRef.current) {
            orbitRef.current.enabled = !draggingId && !resizingDirection
        }
    }, [draggingId, resizingDirection])


    /* ------------------- MOVE LOGIC ------------------- */
    
    const handleTablePointerDown = (e, id, currentX, currentY) => {
        e.stopPropagation()
        onSelect(id)
        
        if (mode === 'translate') {
            setDraggingId(id)
            const offX = e.point.x - (currentX/10)
            const offZ = e.point.z - (currentY/10)
            setDragStartOffset([offX, offZ])
            // OrbitControls disabled by useEffect
        }
    }

    const handleGlobalPointerUp = (e) => {
        e.stopPropagation()
        // Commit Move
        if (draggingId) {
            const table = tables.find(t => t.id === draggingId)
            if (table) {
                const SNAP = 5
                const snappedX = Math.round(table.x / SNAP) * SNAP
                const snappedY = Math.round(table.y / SNAP) * SNAP
                onUpdate({ ...table, x: snappedX, y: snappedY })
            }
            setDraggingId(null)
        }
        // Commit Resize
        if (resizingDirection) {
            setResizingDirection(null)
            setResizeStartPoint(null)
            setInitialResizeData(null)
        }
    }

    /* ------------------- RESIZE LOGIC ------------------- */

    const handleResizeHandleDown = (dir, hitPoint, table) => {
        setResizingDirection(dir)
        // Store initial state
        setInitialResizeData({
            width: table.width || 1.2,
            depth: table.depth || 1.2,
            x: table.x,
            y: table.y
        })
        // We use the hitPoint on the handle as visual start, 
        // BUT for the delta calculation, it's safer to rely on the plane projection
        // to avoid "depth jumps" if handle and plane have different Y.
        // However, standardizing on e.point is usually fine.
        setResizeStartPoint([hitPoint.x, hitPoint.z])
    }

    const handleResizeMove = (e) => {
        if (!resizingDirection || !initialResizeData) return
        e.stopPropagation()
        
        // e.point is on the Global Plane (y=0.4 ideally)
        const currentPoint = [e.point.x, e.point.z]
        const deltaX = currentPoint[0] - resizeStartPoint[0]
        const deltaZ = currentPoint[1] - resizeStartPoint[1]
        
        let newW = initialResizeData.width
        let newD = initialResizeData.depth
        let newX = initialResizeData.x
        let newY = initialResizeData.y

        // Calculate changes based on direction
        const dir = resizingDirection
        
        if (dir === 'x+') {
            // Dragging Right Edge
            // New Width = Old Width + Delta
            newW = Math.max(0.5, initialResizeData.width + deltaX)
            // Center Shift = Change / 2
            // If deltaX is +1 (grew by 1), center moves +0.5
            // But we work in DB units (x10). 
            // Width is visual units. X is DB units.
            // visual shift = (newW - oldW) / 2
            // db shift = visual shift * 10
            const visualShift = (newW - initialResizeData.width) / 2
            newX = initialResizeData.x + (visualShift * 10)
        }
        else if (dir === 'x-') {
            // Dragging Left Edge
            // If we move left (delta negative), width grows
            newW = Math.max(0.5, initialResizeData.width - deltaX)
            const visualShift = (newW - initialResizeData.width) / 2
            newX = initialResizeData.x - (visualShift * 10)
        }
        else if (dir === 'z+') {
            newD = Math.max(0.5, initialResizeData.depth + deltaZ)
            const visualShift = (newD - initialResizeData.depth) / 2
            newY = initialResizeData.y + (visualShift * 10)
        }
        else if (dir === 'z-') {
            newD = Math.max(0.5, initialResizeData.depth - deltaZ)
            const visualShift = (newD - initialResizeData.depth) / 2
            newY = initialResizeData.y - (visualShift * 10)
        }

        // Snap dimensions to 0.1 visual units for cleanliness? 
        // Or keep smooth until drop? User likes smooth.
        // We can snap the Width/Depth to 1 decimal place to prevent weird floats
        newW = Math.round(newW * 10) / 10
        newD = Math.round(newD * 10) / 10
        
        // Recalculate center based on snapped width? 
        // Ideally yes, but let's stick to the direct math for responsiveness.
        
        // Find visible table in list and update
        const table = tables.find(t => t.id === selectedId)
        if(table) {
             onUpdate({ ...table, width: newW, depth: newD, x: newX, y: newY })
        }
    }


    /* ------------------- RENDER ------------------- */
    
    return (
        <>
            <MapControls 
                ref={orbitRef}
                enableRotate={false} 
                enableZoom={true} 
                minZoom={10} 
                maxZoom={50}
                dampingFactor={0.05}
                makeDefault
            />

            {/* Tables */}
            {tables.map(table => {
                const isSelected = table.id === selectedId
                const isDragging = table.id === draggingId
                const w = table.width || 1.2
                const d = table.depth || 1.2
                
                // Color logic
                let color = '#ffffff' // free
                if(table.status === 'ordering') color = '#f97316'
                if(table.status === 'waiting_payment') color = '#22c55e'
                if(isSelected) color = '#3b82f6'
                if(isDragging) color = '#60a5fa' // lighter blue while dragging

                return (
                    <group 
                        key={table.id} 
                        position={[table.x/10, 0.4, table.y/10]}
                    >
                        <mesh
                            onPointerDown={(e) => handleTablePointerDown(e, table.id, table.x, table.y)}
                            onPointerOver={() => setHoveredId(table.id)}
                            onPointerOut={() => setHoveredId(null)}
                        >
                             <boxGeometry args={[w, 0.8, d]} />
                             <meshStandardMaterial color={color} />
                             <Text position={[0,1,0]} fontSize={0.5} color="black">{table.table_number}</Text>
                        </mesh>
                        
                        {/* Handles - Only if Selected and Scale Mode */}
                        {isSelected && mode === 'scale' && !draggingId && (
                            <>
                                <ResizeHandle direction="x+" position={[w/2 + 0.15, 0, 0]} 
                                    onResizeStart={(dir, p) => handleResizeHandleDown(dir, p, table)} 
                                />
                                <ResizeHandle direction="z+" position={[0, 0, d/2 + 0.15]} 
                                    onResizeStart={(dir, p) => handleResizeHandleDown(dir, p, table)} 
                                />
                            </>
                        )}

                        {/* Shadow/Selection Plane */}
                        <mesh position={[0,-0.39,0]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[w+0.2, d+0.2]} />
                            <meshBasicMaterial color={isSelected ? "#3b82f6" : "#000000"} opacity={isSelected?0.3:0.15} transparent />
                        </mesh>
                    </group>
                )
            })}

            {/* GLOBAL INTERACTION PLANE */}
            {/* Active if Dragging OR Resizing. Covers entire scene. */}
            {(draggingId || resizingDirection) && (
                <mesh 
                    rotation={[-Math.PI / 2, 0, 0]} 
                    position={[0, 0.4, 0]} 
                    visible={false} 
                    onPointerMove={(e) => {
                         if (draggingId) {
                            e.stopPropagation()
                            const t = tables.find(t => t.id === draggingId)
                            if (t) {
                                const targetX = e.point.x - dragStartOffset[0]
                                const targetZ = e.point.z - dragStartOffset[1]
                                onUpdate({ ...t, x: targetX * 10, y: targetZ * 10 })
                            }
                         }
                         if (resizingDirection) {
                             handleResizeMove(e)
                         }
                    }}
                    onPointerUp={handleGlobalPointerUp}
                >
                     <planeGeometry args={[1000, 1000]} />
                     <meshBasicMaterial color="red" wireframe />
                </mesh>
            )}

            {/* Permanent Floor */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.4, 0]} 
                receiveShadow
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onSelect(null)
                }}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <gridHelper args={[1000, 50, '#e5e7eb', '#e5e7eb']} position={[0, -0.39, 0]} />
        </>
    )
}

export default function TableEditor({ tables, onTablesUpdate, onSelectTable, selectedTableId, mode = 'translate' }) {
    
    // Internal handler to update one table in the list
    const handleOneTableUpdate = (updatedTable) => {
        const newTables = tables.map(t => 
            t.id === updatedTable.id ? updatedTable : t
        )
        onTablesUpdate(newTables)
    }

    return (
        <Canvas shadows dpr={[1, 2]} onPointerMissed={() => onSelectTable(null)}>
             <color attach="background" args={['#f3f4f6']} />
             <ambientLight intensity={0.6} />
             <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
             <Environment preset="city" />
             
             <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={25} near={-100} far={200} />
             
             <SceneContent 
                tables={tables} 
                onUpdate={handleOneTableUpdate} 
                selectedId={selectedTableId}
                onSelect={onSelectTable}
                mode={mode} // Pass mode here
             />
        </Canvas>
    )
}
