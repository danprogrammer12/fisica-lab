import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { K_COULOMB } from '../../physics/constants'

const K = K_COULOMB

function vDipole(px: number, py: number, pz: number, q: number, sep: number) {
  // +q en (sep/2, 0, 0), -q en (-sep/2, 0, 0)
  const r1 = Math.sqrt((px - sep / 2) ** 2 + py * py + pz * pz)
  const r2 = Math.sqrt((px + sep / 2) ** 2 + py * py + pz * pz)
  if (r1 < 0.05 || r2 < 0.05) return null
  return K * q * (1 / r1 - 1 / r2)
}

// ── Cargas del dipolo ─────────────────────────────────────────
function DipolCharges({ q, sep }: { q: number; sep: number }) {
  const posRef = useRef<THREE.Mesh>(null)
  const negRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.07
    posRef.current?.scale.setScalar(s)
    negRef.current?.scale.setScalar(s)
  })

  return (
    <>
      {/* +q */}
      <group position={[sep / 2, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.12} />
        </mesh>
        <mesh ref={posRef}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={1.2} roughness={0.1} />
        </mesh>
        <Text position={[0, 0.38, 0]} fontSize={0.22} color="#ef4444" anchorX="center">
          {`+${Math.abs(q).toFixed(1)} nC`}
        </Text>
      </group>
      {/* -q */}
      <group position={[-sep / 2, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.12} />
        </mesh>
        <mesh ref={negRef}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={1.2} roughness={0.1} />
        </mesh>
        <Text position={[0, 0.38, 0]} fontSize={0.22} color="#3b82f6" anchorX="center">
          {`−${Math.abs(q).toFixed(1)} nC`}
        </Text>
      </group>
      {/* Eje del dipolo */}
      <Line
        points={[new THREE.Vector3(-sep / 2 - 0.5, 0, 0), new THREE.Vector3(sep / 2 + 0.5, 0, 0)]}
        color="#475569" lineWidth={1} transparent opacity={0.35}
        dashed dashSize={0.1} gapSize={0.06}
      />
      <Text position={[sep / 2 + 0.8, -0.3, 0]} fontSize={0.15} color="#475569">p→</Text>
    </>
  )
}

// ── Superficies equipotenciales del dipolo ────────────────────
// V = 0 es el plano perpendicular al eje por el centro
// V > 0 cerca de +q, V < 0 cerca de -q (formas lobulares)
function EquipotentialSurfaces({ q, sep }: { q: number; sep: number }) {
  const q_C = q * 1e-9
  const SEGS = 120
  const LEVELS = useMemo(() => {
    const Vmax = K * Math.abs(q_C) / 0.3
    // Niveles positivos y negativos
    const pos = [0.08, 0.18, 0.35, 0.60].map(f => f * Vmax)
    const neg = pos.map(v => -v)
    return [...neg.reverse(), ...pos]
  }, [q_C])

  const curves = useMemo(() => {
    return LEVELS.map(Vtarget => {
      const isPos = Vtarget > 0
      const color = isPos ? `#ef4444` : `#3b82f6`
      const alpha = 0.3 + Math.min(Math.abs(Vtarget) / (K * Math.abs(q_C) / 0.3) * 0.55, 0.55)
      // Trazar la curva equipotencial en el plano XY usando ray marching angular
      const pts: THREE.Vector3[] = []
      const CENTER_X = isPos ? sep / 2 : -sep / 2
      const RSTART = 0.2
      // Barremos ángulos y buscamos por bisección el radio donde V = Vtarget
      const NUM_ANGLES = SEGS
      for (let ai = 0; ai <= NUM_ANGLES; ai++) {
        const angle = (ai / NUM_ANGLES) * Math.PI * 2
        // Bisección en r para encontrar donde V(r, angle) = Vtarget
        let rLo = 0.08, rHi = 5.5
        let found = false
        for (let iter = 0; iter < 40; iter++) {
          const rMid = (rLo + rHi) / 2
          const px = CENTER_X + rMid * Math.cos(angle)
          const py = rMid * Math.sin(angle)
          const V = vDipole(px, py, 0, q_C, sep)
          if (V === null) break
          if (isPos ? V > Vtarget : V < Vtarget) {
            rHi = rMid
          } else {
            rLo = rMid
          }
          if (rHi - rLo < 0.005) { found = true; break }
        }
        if (found) {
          const rFinal = (rLo + rHi) / 2
          pts.push(new THREE.Vector3(
            CENTER_X + rFinal * Math.cos(angle),
            rFinal * Math.sin(angle),
            0,
          ))
        }
      }
      if (pts.length > 3) pts.push(pts[0].clone())  // cerrar curva
      return { pts, color, alpha, V: Vtarget }
    })
  }, [LEVELS, q_C, sep])

  return (
    <>
      {curves.map((c, i) => c.pts.length > 3 && (
        <Line key={i} points={c.pts} color={c.color} lineWidth={1.5} transparent opacity={c.alpha} />
      ))}
      {/* Plano V=0 */}
      <mesh>
        <planeGeometry args={[0.02, 8]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0.2, 3.5, 0]} fontSize={0.18} color="#64748b" anchorX="left">V = 0</Text>
    </>
  )
}

// ── Líneas de campo del dipolo ────────────────────────────────
function DipolFieldLines({ q, sep }: { q: number; sep: number }) {
  const q_C = q * 1e-9
  const NUM = 16
  const color = '#fbbf24'

  // Campo E del dipolo
  function eField(px: number, py: number, pz: number) {
    const sign = q_C > 0 ? 1 : -1
    // +q
    const d1x = px - sep / 2, d1y = py, d1z = pz
    const r1 = Math.sqrt(d1x * d1x + d1y * d1y + d1z * d1z)
    // -q
    const d2x = px + sep / 2, d2y = py, d2z = pz
    const r2 = Math.sqrt(d2x * d2x + d2y * d2y + d2z * d2z)
    if (r1 < 0.04 || r2 < 0.04) return null
    const k = K * Math.abs(q_C)
    const ex = k * (sign * d1x / (r1 ** 3) - sign * d2x / (r2 ** 3))
    const ey = k * (sign * d1y / (r1 ** 3) - sign * d2y / (r2 ** 3))
    const ez = k * (sign * d1z / (r1 ** 3) - sign * d2z / (r2 ** 3))
    return new THREE.Vector3(ex, ey, ez)
  }

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = []
    const startR = 0.18
    for (let i = 0; i < NUM; i++) {
      const angle = (i / NUM) * Math.PI * 2
      // Empezamos cerca de +q
      const startX = sep / 2 + startR * Math.cos(angle)
      const startY = startR * Math.sin(angle)
      const pts: THREE.Vector3[] = [new THREE.Vector3(startX, startY, 0)]
      let cx = startX, cy = startY, cz = 0
      const step = 0.055, maxSteps = 180
      for (let s = 0; s < maxSteps; s++) {
        const e = eField(cx, cy, cz)
        if (!e || e.length() < 1e-30) break
        const mag = e.length()
        cx += (e.x / mag) * step
        cy += (e.y / mag) * step
        cz += (e.z / mag) * step
        pts.push(new THREE.Vector3(cx, cy, cz))
        if (Math.sqrt(cx * cx + cy * cy + cz * cz) > 6) break
        // Terminar si llegamos cerca de -q
        const dNeg = Math.sqrt((cx + sep / 2) ** 2 + cy * cy + cz * cz)
        if (dNeg < 0.18) break
      }
      if (pts.length > 3) result.push(pts)
    }
    return result
  }, [q_C, sep, NUM])

  const arrowGroup = useMemo(() => {
    const group = new THREE.Group()
    const c = new THREE.Color(color)
    for (const pts of lines) {
      if (pts.length < 4) continue
      const midIdx = Math.floor(pts.length / 2)
      const from = pts[midIdx - 1], to = pts[midIdx + 1]
      if (!from || !to) continue
      const dir = to.clone().sub(from).normalize()
      const len = 0.4
      const arr = new THREE.ArrowHelper(dir, pts[midIdx], len, c, len * 0.4, len * 0.15)
        ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.6; arr.line.material.transparent = true
        ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.6; arr.cone.material.transparent = true
      group.add(arr)
    }
    return group
  }, [lines])

  useEffect(() => () => {
    arrowGroup.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrowGroup])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1.2} transparent opacity={0.35} />
      ))}
      <primitive object={arrowGroup} />
    </>
  )
}

// ── Partículas animadas ───────────────────────────────────────
function DipolParticles({ q, sep }: { q: number; sep: number }) {
  const q_C = q * 1e-9
  const NUM = 16
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)

  // Pre-calcular trayectorias de campo
  function eField(px: number, py: number) {
    const sign = q_C > 0 ? 1 : -1
    const d1x = px - sep / 2, d1y = py
    const r1 = Math.sqrt(d1x * d1x + d1y * d1y)
    const d2x = px + sep / 2, d2y = py
    const r2 = Math.sqrt(d2x * d2x + d2y * d2y)
    if (r1 < 0.06 || r2 < 0.06) return null
    const k = K * Math.abs(q_C)
    return new THREE.Vector2(
      k * (sign * d1x / (r1 ** 3) - sign * d2x / (r2 ** 3)),
      k * (sign * d1y / (r1 ** 3) - sign * d2y / (r2 ** 3)),
    )
  }

  const trajectories = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => {
      const angle = (i / NUM) * Math.PI * 2
      const startR = 0.22
      const pts: THREE.Vector3[] = []
      let cx = sep / 2 + startR * Math.cos(angle)
      let cy = startR * Math.sin(angle)
      for (let s = 0; s < 100; s++) {
        pts.push(new THREE.Vector3(cx, cy, 0))
        const e = eField(cx, cy)
        if (!e || e.length() < 1e-30) break
        const mag = e.length()
        cx += (e.x / mag) * 0.06
        cy += (e.y / mag) * 0.06
        if (Math.sqrt(cx * cx + cy * cy) > 6) break
        const dNeg = Math.sqrt((cx + sep / 2) ** 2 + cy * cy)
        if (dNeg < 0.2) break
      }
      return pts
    })
  , [q_C, sep])

  const phases = useMemo(() => Array.from({ length: NUM }, (_, i) => i / NUM), [])

  useFrame((_, delta) => {
    tRef.current += delta * 0.45
    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const traj = trajectories[i]
      if (traj.length < 2) continue
      const frac = ((phases[i] + tRef.current * 0.22) % 1 + 1) % 1
      const idx = Math.min(Math.floor(frac * traj.length), traj.length - 1)
      mesh.position.copy(traj[idx])
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.75
    }
  })

  return (
    <>
      {Array.from({ length: NUM }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── HUD pedagógico ────────────────────────────────────────────
function DipolHUD({ q, sep }: { q: number; sep: number }) {
  const q_C = q * 1e-9
  const p = Math.abs(q_C) * sep

  return (
    <group position={[5.5, 4.0, 0]}>
      <Text fontSize={0.21} color="#8b5cf6" anchorX="left" position={[0, 0, 0]}>
        {'Potencial del Dipolo'}
      </Text>
      <Text fontSize={0.16} color="#94a3b8" anchorX="left" position={[0, -0.35, 0]}>
        {'V = k·q(1/r₊ − 1/r₋)'}
      </Text>
      <Text fontSize={0.16} color="#94a3b8" anchorX="left" position={[0, -0.60, 0]}>
        {'≈ k·p·cosθ/r² (lejos)'}
      </Text>
      <Text fontSize={0.16} color="#c4b5fd" anchorX="left" position={[0, -0.90, 0]}>
        {`p = qd = ${(p * 1e9).toExponential(2)} nC·m`}
      </Text>
      <Text fontSize={0.14} color="#ef4444" anchorX="left" position={[0, -1.22, 0]}>{'— equipotencial V > 0'}</Text>
      <Text fontSize={0.14} color="#3b82f6" anchorX="left" position={[0, -1.44, 0]}>{'— equipotencial V < 0'}</Text>
      <Text fontSize={0.14} color="#fbbf24" anchorX="left" position={[0, -1.66, 0]}>{'— líneas de campo E'}</Text>
      <Text fontSize={0.14} color="#64748b" anchorX="left" position={[0, -1.88, 0]}>{'  plano V = 0'}</Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
interface PotencialDipoloProps {
  charge: number   // nC
  separation: number  // m
}

export function PotencialDipoloScene({ charge, separation }: PotencialDipoloProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 10] }}
      style={{ background: '#080c12' }}
    >
      <color attach="background" args={['#080c12']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 6]} intensity={1.5} />
      <pointLight position={[-4, 0, 4]} intensity={0.5} color="#8b5cf6" />

      <DipolCharges q={charge} sep={separation} />
      <EquipotentialSurfaces q={charge} sep={separation} />
      <DipolFieldLines q={charge} sep={separation} />
      <DipolParticles q={charge} sep={separation} />
      <DipolHUD q={charge} sep={separation} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={30} />
    </Canvas>
  )
}
