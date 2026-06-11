import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { K_COULOMB, NC_TO_C } from '../../physics/constants'

const MIN_R = 0.25
const K     = K_COULOMB

interface EquipotencialesSceneProps {
  charge: number
  numLines: number
}

// ── Esferas / anillos equipotenciales ─────────────────────────
// En 3D, equipotenciales de carga puntual son ESFERAS concéntricas.
// Las mostramos como anillos en múltiples planos para claridad.
function EquipotentialSpheres({ charge, numLines }: { charge: number; numLines: number }) {
  const q_C   = charge * NC_TO_C
  const isPos = charge >= 0

  const levels = useMemo(() => {
    const Vmax = K * Math.abs(q_C) / MIN_R
    // Distribuir niveles en escala logarítmica para que queden bien espaciados visualmente
    return Array.from({ length: numLines }, (_, i) => {
      const frac    = 0.06 + (i / (numLines - 1)) * 0.88
      const V_level = frac * Vmax * (isPos ? 1 : -1)
      const r       = Math.abs(K * q_C / V_level)
      const t       = frac   // 0..1 desde el centro
      return { r: Math.min(r, 5.8), V: V_level, t, idx: i }
    })
  }, [q_C, isPos, numLines])

  // Color: rojo intenso cerca de +q, azul intenso cerca de -q, hacia blanco al alejarse
  const getColor = (t: number) => {
    if (isPos) {
      // rojo intenso (t=1) → naranja tenue (t=0)
      const r = Math.floor(200 + t * 55)
      const g = Math.floor(60  - t * 40)
      const b = Math.floor(20)
      return `rgb(${r},${g},${b})`
    } else {
      const r = Math.floor(20)
      const g = Math.floor(60  - t * 40)
      const b = Math.floor(200 + t * 55)
      return `rgb(${r},${g},${b})`
    }
  }

  return (
    <>
      {levels.map(({ r, V, t, idx }) => {
        const alpha  = 0.18 + t * 0.55
        const color  = getColor(t)
        const SEGS   = 72

        // Tres anillos por nivel: XY, XZ, YZ
        const ringXY = Array.from({ length: SEGS + 1 }, (_, j) => {
          const a = (j / SEGS) * Math.PI * 2
          return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)
        })
        const ringXZ = Array.from({ length: SEGS + 1 }, (_, j) => {
          const a = (j / SEGS) * Math.PI * 2
          return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
        })
        const ringYZ = Array.from({ length: SEGS + 1 }, (_, j) => {
          const a = (j / SEGS) * Math.PI * 2
          return new THREE.Vector3(0, Math.sin(a) * r, Math.cos(a) * r)
        })

        return (
          <group key={idx}>
            <Line points={ringXY} color={color} lineWidth={1.4} transparent opacity={alpha} />
            <Line points={ringXZ} color={color} lineWidth={1.4} transparent opacity={alpha * 0.6} />
            <Line points={ringYZ} color={color} lineWidth={1.4} transparent opacity={alpha * 0.6} />

            {/* Etiqueta V en el anillo XY */}
            {idx % 2 === 0 && (
              <Text position={[r + 0.15, 0.12, 0]} fontSize={0.16} color={color} anchorX="left">
                {Math.abs(V) >= 1000
                  ? `${(V / 1000).toFixed(1)} kV`
                  : `${V.toFixed(0)} V`}
              </Text>
            )}
          </group>
        )
      })}
    </>
  )
}

// ── Líneas de campo radiales ───────────────────────────────────
function FieldLines({ charge }: { charge: number }) {
  const isPos  = charge >= 0
  const color  = isPos ? '#fbbf24' : '#67e8f9'
  const NUM    = 18
  const outerR = 6.0

  const lines = useMemo(() => Array.from({ length: NUM }, (_, i) => {
    const phi   = (i / NUM) * Math.PI * 2
    const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
    const dirX  = Math.sin(theta) * Math.cos(phi)
    const dirY  = Math.cos(theta)
    const dirZ  = Math.sin(theta) * Math.sin(phi)

    const inner = new THREE.Vector3(dirX * MIN_R * 1.5, dirY * MIN_R * 1.5, dirZ * MIN_R * 1.5)
    const outer = new THREE.Vector3(dirX * outerR, dirY * outerR, dirZ * outerR)
    return isPos ? [inner, outer] : [outer, inner]
  }), [isPos])

  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const c     = new THREE.Color(color)
    for (const [from, to] of lines) {
      const dir = to.clone().sub(from).normalize()
      const mid = from.clone().lerp(to, 0.5)
      const len = 0.45
      const arr = new THREE.ArrowHelper(dir, mid, len, c, len * 0.4, len * 0.15)
        ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.5; arr.line.material.transparent = true
        ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.5; arr.cone.material.transparent = true
      group.add(arr)
    }
    return group
  }, [lines, color])

  useEffect(() => () => {
    arrows.children.forEach((c) => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1.2} transparent opacity={0.35} />
      ))}
      <primitive object={arrows} />
    </>
  )
}

// ── Partículas moviéndose con el campo ─────────────────────────
function FieldParticles({ charge }: { charge: number }) {
  const NUM    = 20
  const isPos  = charge >= 0
  const color  = isPos ? '#fde68a' : '#a5f3fc'

  const meshRefs  = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)

  const dirs = useMemo(() => Array.from({ length: NUM }, (_, i) => {
    const phi   = (i / NUM) * Math.PI * 2
    const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
    return new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ).normalize()
  }), [])

  const phases = useMemo(() => Array.from({ length: NUM }, (_, i) => i / NUM), [])

  useFrame((_, delta) => {
    tRef.current += delta
    const t = tRef.current
    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const frac = ((phases[i] + t * 0.16) % 1 + 1) % 1
      // Positivo: fluye hacia afuera; negativo: hacia adentro
      const r = isPos
        ? MIN_R * 1.5 + frac * 5.5
        : 5.5 * (1 - frac) + MIN_R * 1.5
      const d = dirs[i]
      mesh.position.set(d.x * r, d.y * r, d.z * r)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.88
    }
  })

  return (
    <>
      {Array.from({ length: NUM }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── Carga central ─────────────────────────────────────────────
function CentralCharge({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPos   = charge >= 0
  const color   = isPos ? '#ef4444' : '#3b82f6'
  const emit    = isPos ? '#7f1d1d' : '#1e3a8a'

  useFrame(({ clock }) => {
    meshRef.current?.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.8) * 0.07)
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.10} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={1.1} roughness={0.1} />
      </mesh>
      <Text position={[0, 0.42, 0]} fontSize={0.22} color={color} anchorX="center">
        {isPos ? `+${Math.abs(charge).toFixed(1)} nC` : `−${Math.abs(charge).toFixed(1)} nC`}
      </Text>
    </group>
  )
}

// ── Partícula de prueba moviéndose SOBRE una equipotencial ─────
// Muestra que W = 0 cuando te mueves sobre la superficie
function TestChargeOnEquipotential({ charge }: { charge: number }) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points | null>(null)
  const tRef = useRef(0)
  const q_C  = charge * NC_TO_C

  // Elegir el tercer anillo equipotencial como trayectoria
  const ringR = useMemo(() => {
    const Vmax = K * Math.abs(q_C) / MIN_R
    const frac = 0.35
    const V    = frac * Vmax * (charge >= 0 ? 1 : -1)
    return Math.min(Math.abs(K * q_C / V), 4.5)
  }, [q_C, charge])

  const TRAIL = 50
  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), [])
  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    return g
  }, [trailPos])

  useFrame((_, delta) => {
    tRef.current += delta * 0.55
    const t = tRef.current
    const x = Math.cos(t) * ringR
    const y = Math.sin(t) * ringR

    if (meshRef.current) meshRef.current.position.set(x, y, 0)

    // Trail
    for (let i = TRAIL - 1; i > 0; i--) {
      trailPos[i * 3]     = trailPos[(i - 1) * 3]
      trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1]
      trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2]
    }
    trailPos[0] = x; trailPos[1] = y; trailPos[2] = 0
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.setDrawRange(0, TRAIL)
  })

  return (
    <>
      {/* Trail punteado */}
      <points geometry={trailGeo}>
        <pointsMaterial color="#34d399" size={0.04} transparent opacity={0.45} sizeAttenuation />
      </points>
      {/* Partícula de prueba */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.4} />
      </mesh>
      {/* Label W=0 */}
      <Text
        position={[ringR * 0.72, ringR * 0.72, 0.1]}
        fontSize={0.18}
        color="#34d399"
        anchorX="center"
      >
        {'W = 0'}
      </Text>
    </>
  )
}

// ── Leyenda en escena ──────────────────────────────────────────
function Legend({ charge }: { charge: number }) {
  const isPos = charge >= 0
  const eq    = isPos ? '#ef4444' : '#3b82f6'
  const field = isPos ? '#fbbf24' : '#67e8f9'

  return (
    <group position={[-6.5, 3.2, 0]}>
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.8, 0, 0)]}
        color={eq} lineWidth={2}
      />
      <Text position={[1.0, 0, 0]} fontSize={0.18} color={eq} anchorX="left">
        Equipotencial (V = cte)
      </Text>
      <Line
        points={[new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(0.8, -0.45, 0)]}
        color={field} lineWidth={1.5}
      />
      <Text position={[1.0, -0.45, 0]} fontSize={0.18} color={field} anchorX="left">
        Línea de campo E⃗
      </Text>
      <Line
        points={[new THREE.Vector3(0, -0.9, 0), new THREE.Vector3(0.8, -0.9, 0)]}
        color="#34d399" lineWidth={1.5}
      />
      <Text position={[1.0, -0.9, 0]} fontSize={0.18} color="#34d399" anchorX="left">
        Carga prueba (W=0)
      </Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
export function EquipotencialesScene({ charge, numLines }: EquipotencialesSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 48, near: 0.1, far: 60, position: [5, 5, 8] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 6, 6]} intensity={1.5} />
      <pointLight position={[-4, 0, -4]} intensity={0.5} color={charge >= 0 ? '#ef4444' : '#3b82f6'} />

      <CentralCharge charge={charge} />
      <EquipotentialSpheres charge={charge} numLines={numLines} />
      <FieldLines charge={charge} />
      <FieldParticles charge={charge} />
      <TestChargeOnEquipotential charge={charge} />
      <Legend charge={charge} />

      <OrbitControls
        makeDefault enablePan enableZoom enableRotate
        minDistance={1.5} maxDistance={25}
      />
    </Canvas>
  )
}
