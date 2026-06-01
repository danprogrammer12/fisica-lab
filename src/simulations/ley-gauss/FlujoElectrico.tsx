import { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { electricFlux } from '../../physics/electrostatics'

// ────────────────────────────────────────────────────────────
// Sub-componente: Plano con normal visible
// ────────────────────────────────────────────────────────────
function FluxPlane({
  area,
  angleDeg,
}: {
  area: number
  angleDeg: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const side = Math.sqrt(area)
  const angleRad = (angleDeg * Math.PI) / 180

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = angleRad
    }
  }, [angleRad])

  return (
    <group ref={groupRef}>
      {/* Plano transparente */}
      <mesh ref={meshRef}>
        <planeGeometry args={[side, side, 8, 8]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>

      {/* Borde del plano */}
      {(() => {
        const h = side / 2
        const corners: [number, number, number][] = [
          [-h, -h, 0], [h, -h, 0], [h, h, 0], [-h, h, 0], [-h, -h, 0],
        ]
        return (
          <Line points={corners} color="#60a5fa" lineWidth={2} />
        )
      })()}

      {/* Vector normal */}
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          1.5,
          0x34d399,
          0.25,
          0.12,
        ]}
      />
      <Text
        position={[0.2, 0, 1.7]}
        fontSize={0.2}
        color="#34d399"
      >
        n̂
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Campo eléctrico uniforme (flechas paralelas)
// ────────────────────────────────────────────────────────────
function UniformField({ fieldMagnitude }: { fieldMagnitude: number }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const count = 5
    const spacing = 1.0
    const offset = ((count - 1) * spacing) / 2
    const len = Math.min(1.5, 0.5 + fieldMagnitude * 0.003)
    const color = new THREE.Color('#f59e0b')

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const y = i * spacing - offset
        const z = j * spacing - offset
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(-3, y, z),
          len,
          color,
          len * 0.25,
          len * 0.1,
        )
        group.add(arrow)
      }
    }
    return group
  }, [fieldMagnitude])

  useEffect(() => {
    return () => {
      arrows.children.forEach((child) => {
        const a = child as THREE.ArrowHelper
        a.line?.geometry?.dispose()
        a.cone?.geometry?.dispose()
      })
    }
  }, [arrows])

  return (
    <group>
      <primitive object={arrows} />
      <Text position={[2.2, -2.5, 0]} fontSize={0.2} color="#f59e0b">
        E⃗
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Visualización del flujo (flechas que pasan por el plano)
// ────────────────────────────────────────────────────────────
function FluxArrows({
  area,
  angleDeg,
  fieldMagnitude,
}: {
  area: number
  angleDeg: number
  fieldMagnitude: number
}) {
  const flux = electricFlux(fieldMagnitude, area, angleDeg)
  const normalizedFlux = Math.max(0, Math.cos((angleDeg * Math.PI) / 180))
  const side = Math.sqrt(area)
  const count = 3
  const spacing = side / (count + 1)
  const color = flux > 0 ? '#34d399' : '#ef4444'

  return (
    <>
      {Array.from({ length: count }, (_, i) =>
        Array.from({ length: count }, (_, j) => {
          const y = (i + 1) * spacing - side / 2
          const z = (j + 1) * spacing - side / 2
          const key = `${i}-${j}`
          const opacity = 0.3 + normalizedFlux * 0.7
          return (
            <mesh
              key={key}
              position={[0, y, z]}
              rotation={[0, (angleDeg * Math.PI) / 180, 0]}
            >
              <cylinderGeometry args={[0.02, 0.02, 2, 6]} rotation-z={Math.PI / 2} />
              <meshStandardMaterial color={color} transparent opacity={opacity} />
            </mesh>
          )
        }),
      )}
    </>
  )
}


// ────────────────────────────────────────────────────────────
// Componente principal exportado
// ────────────────────────────────────────────────────────────
interface FlujoElectricoSceneProps {
  area: number           // m²
  fieldMagnitude: number // N/C
  angleDeg: number       // grados entre E y normal
}

export function FlujoElectricoScene({
  area,
  fieldMagnitude,
  angleDeg,
}: FlujoElectricoSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [6, 4, 7] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />

      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 0, 0]} intensity={0.8} color="#3b82f6" />

      {/* Plano con normal */}
      <FluxPlane area={area} angleDeg={angleDeg} />

      {/* Campo uniforme */}
      <UniformField fieldMagnitude={fieldMagnitude} />

      {/* Flechas de flujo */}
      <FluxArrows area={area} angleDeg={angleDeg} fieldMagnitude={fieldMagnitude} />

      {/* Ejes */}
      <Line points={[[-5, 0, 0], [5, 0, 0]]} color="#1e293b" lineWidth={0.5} />
      <Line points={[[0, -3, 0], [0, 3, 0]]} color="#1e293b" lineWidth={0.5} />

      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={3} maxDistance={20} target={[0, 0, 0]} />
    </Canvas>
  )
}
