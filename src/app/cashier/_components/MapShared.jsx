'use client'
import * as THREE from 'three'
import { PerspectiveCamera, RoundedBox, Text, useTexture } from '@react-three/drei'

// 1. Shared Camera Setup
export function MapCamera() {
    return (
        <PerspectiveCamera makeDefault fov={10} position={[-60, 80, 100]} />
    )
}

// 2. Shared Floor (Dynamic Textures/Colors)
export function MapFloor({ textureType = 'terrazzo' }) {
    // Load all textures upfront (cached by three/fiber)
    const textures = useTexture({
        parquet: '/textures/wood_parquet.png',
        concrete: '/textures/concrete.png',
        marble: '/textures/marble.png',
        terrazzo: '/textures/terrazzo.png',
    })

    // Configure repeating for all loaded textures
    Object.values(textures).forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(15, 15)
        t.colorSpace = THREE.SRGBColorSpace
    })

    // Render based on type
    if (textureType === 'white') {
        return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
                <planeGeometry args={[70, 70]} />
                <meshStandardMaterial color="#e0ебе9" roughness={0.1} />
            </mesh>
        )
    }
    
    if (textureType === 'black') {
        return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
                <planeGeometry args={[70, 70]} />
                <meshStandardMaterial color="#1f1d2b" roughness={0.1} />
            </mesh>
        )
    }

    // Default or Specific Texture
    const selectedTexture = textures[textureType] || textures.parquet
    const roughness = textureType === 'concrete' ? 0.9 : (textureType === 'marble' ? 0.1 : 0.8)

    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.4, 0]} 
            receiveShadow
        >
            <planeGeometry args={[95, 95]} />
            <meshStandardMaterial map={selectedTexture} roughness={roughness} />
        </mesh>
    )
}

// Helper to get background/fog color based on texture type
export function getFloorColor(type) {
    switch(type) {
        case 'parquet': return '#d4c5b0' // Match wood tone
        case 'concrete': return '#808080' // Match concrete grey
        case 'marble': return '#e5e7eb' // Match white marble
        case 'terrazzo': return '#f3f4f6' // Match terrazzo background
        case 'white': return '#ffffff'
        case 'black': return '#1f1d2b'
        default: return '#f3f4f6'
    }
}

// 3. Shared Table Visuals (Body + Legs + Text)
// Does NOT include: Interaction logic, Avatars, or Status Animations
export function TableVisual({ width, depth, tableNumber, color = '#FDFBF7', materialRef }) {
    return (
        <group>
             {/* Table Body - RoundedBox */}
            <RoundedBox args={[width, 0.5, depth]} radius={0.15} smoothness={4}>
                <meshStandardMaterial 
                    ref={materialRef} // Allow parent to animate color/emissive if needed
                    color={color}
                    roughness={0.2} 
                    metalness={0.1} 
                />
            </RoundedBox>
            
            {/* FAKE SHADOW - "Stuck to table" */}
            <Text
                position={[0, 0.3, -0.1]} // Slightly offset on the table surface
                rotation={[-Math.PI / 2, 0, 0.005]} 
                fontSize={Math.min(width, depth) * 0.35} 
                maxWidth={width * 0.8} 
                font="https://fonts.gstatic.com/s/bitcountpropsingle/v3/-W-gXIv9SyXT0xz0E9pIHCxbW8ZMGEVdhz4VoumsGFhzYseFqK9f_KOwYjYsHSocfu1DlxztzQH877SgJ2SUzQ4SJdODLz0JoLU3vXFrqXQooCdbs921GXZlLGU.ttf"
                color="#000000" 
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.2} // Low opacity for shadow look
                letterSpacing={-0.05}
            >
                {tableNumber}
            </Text>

            {/* FLOATING NUMBER - Hovering above */}
            <Text
                position={[0, 0.55, 0.1]} // Floating nicely high
                rotation={[-Math.PI / 4, 0, 0]} 
                fontSize={Math.min(width, depth) * 0.35} 
                maxWidth={width * 0.8} 
                font="https://fonts.gstatic.com/s/bitcountpropsingle/v3/-W-gXIv9SyXT0xz0E9pIHCxbW8ZMGEVdhz4VoumsGFhzYseFqK9f_KOwYjYsHSocfu1DlxztzQH877SgJ2SUzQ4SJdODLz0JoLU3vXFrqXQooCdbs921GXZlLGU.ttf"
                color="#1f1d2b" 
                anchorX="center"
                anchorY="middle"
                fillOpacity={1}
                letterSpacing={-0.05}
            >
                {tableNumber}
            </Text>

             {/* Simple Rectangular Legs (3 Corners) */}
             <group position={[0, -0.35, 0]}>
                {/* Corner 1 (Front Right) */}
                <mesh position={[width / 2 - 0.1, 0, depth / 2 - 0.1]}>
                    <boxGeometry args={[0.15, 0.35, 0.15]} />
                    <meshStandardMaterial color="#4b5563" /> 
                </mesh>
                {/* Corner 2 (Front Left) */}
                <mesh position={[-width / 2 + 0.1, 0, depth / 2 - 0.1]}>
                    <boxGeometry args={[0.15, 0.35, 0.15]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
                {/* Corner 3 (Back Left) */}
                <mesh position={[-width / 2 + 0.1, 0, -depth / 2 + 0.1]}>
                    <boxGeometry args={[0.15, 0.35, 0.15]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
            </group>
        </group>
    )
}
