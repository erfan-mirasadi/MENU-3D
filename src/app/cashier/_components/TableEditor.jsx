'use client'
import { Canvas, useThree } from '@react-three/fiber'
import { MapControls, OrthographicCamera, Environment, Text, useCursor } from '@react-three/drei'
import { useState, useRef, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import * as THREE from 'three'

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
                onResizeStart(direction, e.point)
            }}
        >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshBasicMaterial color={hovered ? "#f59e0b" : "#3b82f6"} />
        </mesh>
    )
}

function SceneContent({ tables, onUpdate, selectedId, onSelect }) {
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

    const tableRefs = useRef({})

    // Disable OrbitControls when any interaction is active
    useEffect(() => {
        if (orbitRef.current) {
            orbitRef.current.enabled = !draggingId && !resizingDirection
        }
    }, [draggingId, resizingDirection])


    /* ------------------- MOVE LOGIC ------------------- */
    
    const handleTablePointerDown = (e, id) => {
        e.stopPropagation()
        onSelect(id)
        
        setDraggingId(id)
        
        // Store offset relative to the group's current position (visual) vs click point
        // Pointer X/Z are in world space (approx). 
        // Group position is tables.x/10.
        
        const mesh = tableRefs.current[id]
        if (mesh) {
             const currentGroupX = mesh.position.x
             const currentGroupZ = mesh.position.z
             
             // Calculate visual offset
             const offX = e.point.x - currentGroupX
             const offZ = e.point.z - currentGroupZ
             
             setDragStartOffset([offX, offZ])
        }
    }

    const handleGlobalPointerUp = (e) => {
        e.stopPropagation()
        
        // Commit Move
        if (draggingId) {
            const table = tables.find(t => t.id === draggingId)
            const mesh = tableRefs.current[draggingId]
            
            if (table && mesh) {
                // Read final visual position from ref
                const finalVisualX = mesh.position.x
                const finalVisualZ = mesh.position.z
                
                // Convert to DB units
                const dbX = finalVisualX * 10
                const dbY = finalVisualZ * 10 // Z becomes Y in DB
                
                // Snap
                const SNAP = 5
                const snappedX = Math.round(dbX / SNAP) * SNAP
                const snappedY = Math.round(dbY / SNAP) * SNAP
                
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
        setInitialResizeData({
            width: table.width || 1.2,
            depth: table.depth || 1.2,
            x: table.x,
            y: table.y
        })
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
        // NOTE: For resize, we are still updating React state because geometry changes are expensive/complex to do purely imperatively without rerender.
        // It's acceptable for V1.
        
        if (resizingDirection === 'x+') {
            newW = Math.max(0.5, initialResizeData.width + deltaX)
            const visualShift = (newW - initialResizeData.width) / 2
            newX = initialResizeData.x + (visualShift * 10)
        }
        else if (resizingDirection === 'x-') {
            newW = Math.max(0.5, initialResizeData.width - deltaX)
            const visualShift = (newW - initialResizeData.width) / 2
            newX = initialResizeData.x - (visualShift * 10)
        }
        else if (resizingDirection === 'z+') {
            newD = Math.max(0.5, initialResizeData.depth + deltaZ)
            const visualShift = (newD - initialResizeData.depth) / 2
            newY = initialResizeData.y + (visualShift * 10)
        }
        else if (resizingDirection === 'z-') {
            newD = Math.max(0.5, initialResizeData.depth - deltaZ)
            const visualShift = (newD - initialResizeData.depth) / 2
            newY = initialResizeData.y - (visualShift * 10)
        }

        newW = Math.round(newW * 10) / 10
        newD = Math.round(newD * 10) / 10
        
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
                        ref={el => tableRefs.current[table.id] = el}
                    >
                        <mesh
                            onPointerDown={(e) => handleTablePointerDown(e, table.id)}
                            onPointerOver={() => setHoveredId(table.id)}
                            onPointerOut={() => setHoveredId(null)}
                        >
                             <boxGeometry args={[w, 0.8, d]} />
                             <meshStandardMaterial color={color} />
                             <Text 
                                position={[0, 0.41, 0]} 
                                rotation={[-Math.PI / 2, 0, 0]}
                                fontSize={Math.min(w, d) * 0.35} 
                                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                                color="#1f2937" // Gray-800 for a softer print look
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={w * 0.8}
                                letterSpacing={-0.05}
                             >
                                {table.table_number}
                             </Text>
                        </mesh>
                        
                        {/* Handles - Always show if Selected (Unified Mode) */}
                        {isSelected && !draggingId && (
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
                            // OPTIMIZED: Direct Mutation
                             const mesh = tableRefs.current[draggingId]
                             if (mesh) {
                                 const newX = e.point.x - dragStartOffset[0]
                                 const newZ = e.point.z - dragStartOffset[1]
                                 mesh.position.set(newX, 0.4, newZ)
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

export default function TableEditor({ tables, onTablesUpdate, onSelectTable, selectedTableId }) {
    
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
             />
        </Canvas>
    )
}
