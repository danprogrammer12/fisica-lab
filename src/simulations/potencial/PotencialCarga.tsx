import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { K_COULOMB, NC_TO_C } from '../../physics/constants'

const MIN_R = 0.3
const RANGE = 5.5
const N     = 72
const HMAX  = 3.0

interface PotencialCargaSceneProps { charge: number }

// ── Superficie V(r) desplazada en altura ──────────────────────
function PotentialSurface({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const q_C     = charge * NC_TO_C

  const geometry = useMemo(() => {
    const geo  = new THREE.PlaneGeometry(RANGE * 2, RANGE * 2, N - 1, N - 1)
    const pos  = geo.attributes.position.array as Float32Array
    const cols = new Float32Array(pos.length)
    const Vs: number[] = []

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1]
      const r = Math.sqrt(x * x + y * y)
      Vs.push((K_COULOMB * q_C) / Math.max(r, MIN_R))
    }

    const Vmax = Math.max(...Vs.map(Math.abs), 1)
    for (let vi = 0; vi < Vs.length; vi++) {
      const t = Math.max(-1, Math.min(1, Vs[vi] / Vmax))
      pos[vi * 3 + 2] = t * HMAX

      // Rojo (V>0) → negro (V≈0) → azul (V<0)
      if (t >= 0) {
        cols[vi * 3]     = 0.12 + t * 0.88
        cols[vi * 3 + 1] = 0.03 * (1 - t)
        cols[vi * 3 + 2] = 0.03 * (1 - t)
      } else {
        const u = -t
        cols[vi * 3]     = 0.03 * (1 - u)
        cols[vi * 3 + 1] = 0.03 * (1 - u)
        cols[vi * 3 + 2] = 0.12 + u * 0.88
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    geo.computeVertexNormals()
    return geo
  }, [charge, q_C])

  // Rotación muy suave si el usuario no interactúa (se detiene al hacer drag)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 0.018
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        vertexColors side={THREE.DoubleSide}
        roughness={0.55} metalness={0.05}
        transparent opacity={0.92}
      />
    </mesh>
  )
}

// ── Anillos equipotenciales con label de V ────────────────────
function EquipotentialRings({ charge }: { charge: number }) {
  const q_C   = charge * NC_TO_C
  const isPos = charge >= 0
  const LEVELS = 6

  const rings = useMemo(() => {
    const Vmax   = (K_COULOMB * Math.abs(q_C)) / MIN_R
    const fracs  = [0.12, 0.25, 0.40, 0.57, 0.72, 0.88]
    return fracs.map((frac, i) => {
      const V_level = frac * Vmax * (isPos ? 1 : -1)
      const r       = Math.abs((K_COULOMB * q_C) / V_level)
      const h       = frac * HMAX * (isPos ? 1 : -1)
      const rClamped = Math.min(r, RANGE * 0.93)
      return { r: rClamped, h, V: V_level, frac, idx: i }
    })
  }, [q_C, isPos])

  return (
    <>
      {rings.map(({ r, h, V, idx }) => {
        const SEGS = 96
        const pts  = Array.from({ length: SEGS + 1 }, (_, j) => {
          const a = (j / SEGS) * Math.PI * 2
          return new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r)
        })
        const alpha = 0.45 + (1 - idx / LEVELS) * 0.45
        const col   = isPos ? '#f97316' : '#818cf8'
        return (
          <group key={idx}>
            <Line points={pts} color={col} lineWidth={1.6} transparent opacity={alpha} />
            {/* Label en un punto del anillo */}
            <Text
              position={[r + 0.2, h + 0.1, 0]}
              fontSize={0.16} color={col} anchorX="left"
            >
              {`${(V / 1000).toFixed(1)} kV`}
            </Text>
          </group>
        )
      })}
    </>
  )
}

// ── Partículas deslizándose por el gradiente ───────────────────
// Simula una carga de prueba que "desciende" el potencial (positivo → zona −V)
function GradientParticles({ charge }: { charge: number }) {
  const NUM    = 14
  const isPos  = charge >= 0
  const q_C    = charge * NC_TO_C
  const color  = '#a78bfa'

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)

  // Cada partícula tiene un azimut fijo y se mueve radialmente
  const particles = useMemo(() => Array.from({ length: NUM }, (_, i) => ({
    phi:   (i / NUM) * Math.PI * 2,
    phase: i / NUM,
  })), [])

  useFrame((_, delta) => {
    tRef.current += delta
    const t = tRef.current
    const Vmax = (K_COULOMB * Math.abs(q_C)) / MIN_R || 1

    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const p = particles[i]
      const frac = ((p.phase + t * 0.12) % 1 + 1) % 1

      // La partícula va del centro (r=MIN_R) hacia afuera (r=RANGE)
      const r     = MIN_R + frac * (RANGE * 0.88 - MIN_R)
      const V     = (K_COULOMB * q_C) / r
      const h     = (V / Vmax) * HMAX   // sigue la superficie

      mesh.position.set(
        Math.cos(p.phi) * r,
        h,
        Math.sin(p.phi) * r,
      )

      // Brilla más en zonas de alto potencial
      const brightness = Math.abs(V / Vmax)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = 0.35 + brightness * 0.55
        ; (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + brightness * 1.4
    }
  })

  return (
    <>
      {Array.from({ length: NUM }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={1.2}
            transparent opacity={0.8}
          />
        </mesh>
      ))}
    </>
  )
}

// ── Carga en el pico/fondo de la superficie ───────────────────
function ChargeMarker({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPos   = charge >= 0
  const color   = isPos ? '#ef4444' : '#3b82f6'
  const emit    = isPos ? '#7f1d1d' : '#1e3a8a'
  const yPos    = HMAX * (isPos ? 1 : -1)

  useFrame(({ clock }) => {
    meshRef.current?.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.07)
  })

  return (
    <group position={[0, yPos, 0]}>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.10} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={1.2} />
      </mesh>
      <Text position={[0, 0.52, 0]} fontSize={0.24} color={color} anchorX="center">
        {isPos ? `+${Math.abs(charge).toFixed(1)} nC` : `−${Math.abs(charge).toFixed(1)} nC`}
      </Text>
    </group>
  )
}

// ── Curva 1D: V(r) en plano lateral ──────────────────────────
// Línea blanca que traza el perfil V(r) a lo largo del eje X
function ProfileCurve({ charge }: { charge: number }) {
  const q_C    = charge * NC_TO_C
  const Vmax   = (K_COULOMB * Math.abs(q_C)) / MIN_R || 1
  const steps  = 80

  const pts = useMemo(() => Array.from({ length: steps }, (_, i) => {
    const r = MIN_R + (i / (steps - 1)) * (RANGE * 0.9 - MIN_R)
    const V = (K_COULOMB * q_C) / r
    const h = (V / Vmax) * HMAX
    return new THREE.Vector3(r, h, 0)
  }), [q_C, Vmax])

  const ptsNeg = useMemo(() => pts.map(p => new THREE.Vector3(-p.x, p.y, p.z)), [pts])

  return (
    <>
      <Line points={pts}    color="#e2e8f0" lineWidth={2.2} transparent opacity={0.55} />
      <Line points={ptsNeg} color="#e2e8f0" lineWidth={2.2} transparent opacity={0.55} />
    </>
  )
}

// ── Plano de referencia V=0 ───────────────────────────────────
function ZeroPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[RANGE * 2, RANGE * 2, 10, 10]} />
      <meshBasicMaterial color="#0d1524" wireframe transparent opacity={0.25} />
    </mesh>
  )
}

// ── HUD con valores clave ─────────────────────────────────────
function FluxHUD({ charge }: { charge: number }) {
  const q_C = charge * NC_TO_C
  const v1  = (K_COULOMB * q_C) / 1
  const v2  = (K_COULOMB * q_C) / 2
  const isPos = charge >= 0
  const col   = isPos ? '#f97316' : '#818cf8'

  return (
    <group position={[RANGE * 0.6, 0.3, -RANGE * 0.7]}>
      <Text fontSize={0.18} color={col} anchorX="left" position={[0, 0.5, 0]}>
        {'V = k·q / r'}
      </Text>
      <Text fontSize={0.15} color="#64748b" anchorX="left" position={[0, 0.18, 0]}>
        {`V(1m) = ${(v1 / 1000).toFixed(1)} kV`}
      </Text>
      <Text fontSize={0.15} color="#64748b" anchorX="left" position={[0, -0.06, 0]}>
        {`V(2m) = ${(v2 / 1000).toFixed(1)} kV`}
      </Text>
      <Text fontSize={0.13} color="#334155" anchorX="left" position={[0, -0.32, 0]}>
        {'↑ altura = potencial'}
      </Text>
    </group>
  )
}

export function PotencialCargaScene({ charge }: PotencialCargaSceneProps) {
  const isPos  = charge >= 0
  const camY   = isPos ? 7 : 4
  const camZ   = isPos ? 9 : 11
  const tgt    = new THREE.Vector3(0, isPos ? 1.2 : -1.2, 0)

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 46, near: 0.1, far: 80, position: [2, camY, camZ] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 8, 4]} intensity={2.0} />
      <pointLight position={[-4, 4, -4]} intensity={0.7} color="#a78bfa" />

      <ZeroPlane />
      <PotentialSurface charge={charge} />
      <ProfileCurve charge={charge} />
      <EquipotentialRings charge={charge} />
      <GradientParticles charge={charge} />
      <ChargeMarker charge={charge} />
      <FluxHUD charge={charge} />

      <OrbitControls
        makeDefault target={tgt}
        enablePan enableZoom enableRotate
        minDistance={3} maxDistance={30}
      />
    </Canvas>
  )
}
