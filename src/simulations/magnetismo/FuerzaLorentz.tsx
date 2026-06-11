/**
 * Fuerza de Lorentz — Simulación mejorada
 * B apunta en +Z. v0x → circular en plano XY. v0z → componente helicoidal.
 * Muestra: campo B 3D, órbita, trail, vectores v/F, radio ciclotrónico,
 * plano de la órbita, indicador de perpendicularidad y régimen.
 */
import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

interface FuerzaLorentzProps {
  B: number       // T
  charge: number  // C (con signo)
  mass: number    // kg
  v0x: number     // m/s  velocidad perpendicular a B
  v0z: number     // m/s  velocidad paralela a B
}

// ── Campo B: columnas de líneas en Z ─────────────────────────
function BFieldLines({ B }: { B: number }) {
  const isOut = B >= 0
  const color = '#06b6d4'

  // Grilla de líneas verticales (dirección Z) + flechas
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const GRID = 6, SPAN = 5.5, step = (SPAN * 2) / (GRID - 1)
    const dir  = new THREE.Vector3(0, 0, isOut ? 1 : -1)
    const col  = new THREE.Color(color)

    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        const x = -SPAN + ix * step
        const y = -SPAN + iy * step
        // Arrow small at z=1
        const arr = new THREE.ArrowHelper(
          dir, new THREE.Vector3(x, y, isOut ? 0.8 : 3.2),
          0.55, col, 0.18, 0.07,
        )
          ;(arr.line.material as THREE.LineBasicMaterial).opacity = 0.20
          ;(arr.line.material as THREE.LineBasicMaterial).transparent = true
          ;(arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.28
          ;(arr.cone.material as THREE.MeshBasicMaterial).transparent = true
        group.add(arr)
      }
    }
    return group
  }, [B, isOut])

  // Líneas verticales de campo
  const fieldLines = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = []
    const GRID = 6, SPAN = 5.5, step = (SPAN * 2) / (GRID - 1)
    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        const x = -SPAN + ix * step, y = -SPAN + iy * step
        lines.push([new THREE.Vector3(x, y, -1.5), new THREE.Vector3(x, y, 5)])
      }
    }
    return lines
  }, [])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return (
    <group>
      {fieldLines.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color={color} lineWidth={0.6} transparent opacity={0.10} />
      ))}
      <primitive object={arrows} />
      {/* Etiqueta B */}
      <Text position={[6.2, -5.5, 2.5]} fontSize={0.22} color={color} anchorX="left">
        {`B⃗ = ${Math.abs(B).toFixed(2)} T`}
      </Text>
      <Text position={[6.2, -5.5, 2.1]} fontSize={0.17} color="#475569" anchorX="left">
        {isOut ? '(apunta +Z ↑)' : '(apunta −Z ↓)'}
      </Text>
    </group>
  )
}

// ── Plano XY de referencia de la órbita ──────────────────────
function OrbitPlane({ r }: { r: number }) {
  const size = Math.max(r * 2.8, 4)
  return (
    <group>
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#0d1b2e" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Borde del plano */}
      <Line
        points={[
          new THREE.Vector3(-size/2, -size/2, 0),
          new THREE.Vector3( size/2, -size/2, 0),
          new THREE.Vector3( size/2,  size/2, 0),
          new THREE.Vector3(-size/2,  size/2, 0),
          new THREE.Vector3(-size/2, -size/2, 0),
        ]}
        color="#1e3a5f" lineWidth={1} transparent opacity={0.4}
      />
      <Text position={[size/2 + 0.3, -size/2, 0]} fontSize={0.16} color="#334155">
        plano XY
      </Text>
    </group>
  )
}

// ── Círculo del radio ciclotrónico ────────────────────────────
function CyclotronCircle({ r, charge }: { r: number; charge: number }) {
  const SEGS = 128
  const color = charge >= 0 ? '#fbbf24' : '#818cf8'

  const pts = useMemo(() =>
    Array.from({ length: SEGS + 1 }, (_, i) => {
      const a = (i / SEGS) * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)
    })
  , [r])

  return (
    <group>
      <Line points={pts} color={color} lineWidth={1.5} transparent opacity={0.35}
        dashed dashSize={0.15} gapSize={0.10} />
      {/* Flecha del radio */}
      <Line
        points={[new THREE.Vector3(0,0,0), new THREE.Vector3(r * 0.85, 0, 0)]}
        color="#64748b" lineWidth={1.5} dashed dashSize={0.12} gapSize={0.06}
      />
      <Text position={[r * 0.45, 0.22, 0]} fontSize={0.18} color="#64748b">
        {`r = ${(r * 1000).toFixed(1)} mm`}
      </Text>
      {/* Centro de la órbita */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#334155" emissive="#334155" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0.15, -0.22, 0]} fontSize={0.15} color="#475569">centro</Text>
    </group>
  )
}

// ── Indicador del pitch (helicoidal) ─────────────────────────
function HelixPitchIndicator({ r, pitchDist }: { r: number; pitchDist: number }) {
  if (Math.abs(pitchDist) < 0.01) return null
  const x = r + 0.6
  const pts: [number,number,number][] = [[x, 0, 0], [x, 0, pitchDist]]
  return (
    <group>
      <Line points={pts} color="#a78bfa" lineWidth={2} transparent opacity={0.7} />
      {/* Flechas en los extremos */}
      <arrowHelper args={[
        new THREE.Vector3(0,0,1), new THREE.Vector3(x, 0, 0),
        Math.abs(pitchDist) * 0.4, 0xa78bfa, 0.12, 0.06,
      ]} />
      <Text position={[x + 0.2, 0, pitchDist / 2]} fontSize={0.16} color="#a78bfa" anchorX="left">
        {`p = ${Math.abs(pitchDist).toFixed(2)} m`}
      </Text>
    </group>
  )
}

// ── Partícula con trail y vectores v/F ────────────────────────
function OrbitParticle({
  B, charge, mass, v0x, v0z,
}: { B: number; charge: number; mass: number; v0x: number; v0z: number }) {
  const particleRef = useRef<THREE.Mesh>(null)
  const tRef        = useRef(0)

  const physics = useMemo(() => {
    const qB = Math.abs(charge) * Math.abs(B)
    if (qB < 1e-30 || Math.abs(v0x) < 1e-6) return null
    const r     = (mass * Math.abs(v0x)) / qB
    const omega = qB / mass
    const dir   = charge * B > 0 ? 1 : -1
    const T_cyc = (2 * Math.PI * mass) / qB
    return { r, omega, dir, T_cyc }
  }, [B, charge, mass, v0x, v0z])

  const isHelical    = Math.abs(v0z) > 1e-4
  const SPEED_VISUAL = 2.8

  // Trayectoria pre-calculada
  const orbitPts = useMemo(() => {
    if (!physics) return []
    const { r, dir } = physics
    const turns = isHelical ? 5 : 1
    const SEGS  = 256
    return Array.from({ length: SEGS * turns + 1 }, (_, i) => {
      const frac = i / (SEGS * turns)
      const ang  = frac * Math.PI * 2 * turns * dir
      const z    = isHelical ? frac * turns * (v0z > 0 ? 3.5 : -3.5) : 0
      return new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z)
    })
  }, [physics, isHelical, v0z])

  // Trail
  const TRAIL    = 180
  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), [])
  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    return g
  }, [trailPos])
  const trailMat = useMemo(() =>
    new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.7, linewidth: 2 })
  , [])

  // Arrows v y F
  const vArrow = useRef<THREE.ArrowHelper | null>(null)
  const fArrow = useRef<THREE.ArrowHelper | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!physics) return
    const va = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.6,
      new THREE.Color('#34d399'), 0.35, 0.13,
    )
    const fa = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1.2,
      new THREE.Color('#ef4444'), 0.28, 0.11,
    )
      ;(va.line.material as THREE.LineBasicMaterial).linewidth = 2
      ;(fa.line.material as THREE.LineBasicMaterial).linewidth = 2
    vArrow.current = va
    fArrow.current = fa
    groupRef.current?.add(va, fa)
    return () => {
      va.line.geometry.dispose(); va.cone.geometry.dispose()
      fa.line.geometry.dispose(); fa.cone.geometry.dispose()
      groupRef.current?.remove(va, fa)
    }
  }, [physics])

  useFrame((_, delta) => {
    if (!physics || !particleRef.current) return
    tRef.current += delta * SPEED_VISUAL

    const { r, omega, dir } = physics
    const t   = tRef.current
    const ang = dir * omega * t
    const z   = isHelical ? (v0z / (Math.abs(v0x) + 1)) * t * r * 0.8 : 0

    const px = Math.cos(ang) * r
    const py = Math.sin(ang) * r
    particleRef.current.position.set(px, py, z)

    // Trail rolling buffer
    for (let i = TRAIL - 1; i > 0; i--) {
      trailPos[i * 3]     = trailPos[(i - 1) * 3]
      trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1]
      trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2]
    }
    trailPos[0] = px; trailPos[1] = py; trailPos[2] = z
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.setDrawRange(0, TRAIL)

    // Vectores
    const vx = -Math.sin(ang) * dir
    const vy =  Math.cos(ang) * dir
    const vzN = isHelical ? 0.25 : 0
    const vMag = Math.sqrt(vx*vx + vy*vy + vzN*vzN)
    const vDir = new THREE.Vector3(vx/vMag, vy/vMag, vzN/vMag)
    const fDir = new THREE.Vector3(-px, -py, 0).normalize()

    if (vArrow.current) {
      vArrow.current.position.set(px, py, z)
      vArrow.current.setDirection(vDir)
    }
    if (fArrow.current) {
      fArrow.current.position.set(px, py, z)
      fArrow.current.setDirection(fDir)
    }
  })

  const pColor = charge >= 0 ? '#ef4444' : '#3b82f6'
  const pEmit  = charge >= 0 ? '#7f1d1d' : '#1e3a5f'

  return (
    <group ref={groupRef}>
      {/* Trayectoria pre-calculada */}
      {orbitPts.length > 1 && (
        <Line points={orbitPts} color="#06b6d4" lineWidth={1.2}
          transparent opacity={0.22} dashed dashSize={0.18} gapSize={0.10} />
      )}
      {/* Trail animado */}
      <primitive object={new THREE.Line(trailGeo, trailMat)} />
      {/* Partícula */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshStandardMaterial color={pColor} emissive={pEmit}
          emissiveIntensity={1.4} roughness={0.05} metalness={0.3} />
      </mesh>
    </group>
  )
}

// ── Eje Z con etiqueta de dirección B ─────────────────────────
function BAxis({ B }: { B: number }) {
  const isOut = B >= 0
  const color = '#06b6d4'
  return (
    <group>
      <Line
        points={[new THREE.Vector3(0,0,-2), new THREE.Vector3(0,0,5)]}
        color={color} lineWidth={1.5} transparent opacity={0.35}
        dashed dashSize={0.18} gapSize={0.09}
      />
      <arrowHelper args={[
        new THREE.Vector3(0,0,isOut ? 1:-1),
        new THREE.Vector3(0,0,isOut ? 3.5 : 0.5),
        0.8, new THREE.Color(color).getHex(), 0.22, 0.09,
      ]} />
      <Text position={[0.3, 0.3, isOut ? 4.5 : -1.5]} fontSize={0.22} color={color}>
        {isOut ? 'B⃗ ↑' : 'B⃗ ↓'}
      </Text>
    </group>
  )
}

// ── Label de régimen (circular / helicoidal) ──────────────────
function RegimeLabel({ isHelical, charge }: { isHelical: boolean; charge: number }) {
  const color = isHelical ? '#a78bfa' : (charge >= 0 ? '#fbbf24' : '#818cf8')
  return (
    <Text
      position={[0, 0, isHelical ? 5.5 : 4.2]}
      fontSize={0.26} color={color} anchorX="center"
    >
      {isHelical ? '⟳ MOVIMIENTO HELICOIDAL' : '⟳ MOVIMIENTO CIRCULAR'}
    </Text>
  )
}

// ── HUD mejorado ──────────────────────────────────────────────
function LorentzHUD({
  B, charge, mass, v0x, v0z,
}: { B: number; charge: number; mass: number; v0x: number; v0z: number }) {
  const qB      = Math.abs(charge) * Math.abs(B)
  const hasPhys = qB > 1e-30 && Math.abs(v0x) > 1e-6
  const r       = hasPhys ? (mass * Math.abs(v0x)) / qB : null
  const T_s     = hasPhys ? (2 * Math.PI * mass) / qB : null
  const f_Hz    = T_s ? 1 / T_s : null
  const F_N     = hasPhys ? Math.abs(charge) * Math.abs(v0x) * Math.abs(B) : 0
  const v_total = Math.sqrt(v0x*v0x + v0z*v0z)
  const KE      = 0.5 * mass * v_total * v_total
  const isHel   = Math.abs(v0z) > 1e-4

  return (
    <group position={[-8.5, 5.5, 0]}>
      {/* Título */}
      <Text fontSize={0.21} color="#06b6d4" anchorX="left" position={[0, 0, 0]}>
        {'F⃗ = q(v⃗ × B⃗)'}
      </Text>

      {/* Separador */}
      <Line points={[new THREE.Vector3(0,-0.28,0), new THREE.Vector3(6,-0.28,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Campo B */}
      <Text fontSize={0.17} color="#06b6d4" anchorX="left" position={[0, -0.48, 0]}>
        {`B = ${B >= 0 ? '+' : ''}${B.toFixed(2)} T  (${B >= 0 ? '+Z ↑' : '−Z ↓'})`}
      </Text>
      {/* Velocidades */}
      <Text fontSize={0.16} color="#34d399" anchorX="left" position={[0, -0.71, 0]}>
        {`v⊥ = ${(v0x/1e6).toFixed(2)}×10⁶ m/s`}
      </Text>
      {isHel && (
        <Text fontSize={0.16} color="#a78bfa" anchorX="left" position={[0, -0.92, 0]}>
          {`v∥ = ${(v0z/1e6).toFixed(2)}×10⁶ m/s`}
        </Text>
      )}

      {/* Separador */}
      <Line points={[new THREE.Vector3(0, isHel ? -1.12 : -0.92,0), new THREE.Vector3(6, isHel ? -1.12 : -0.92,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Magnitudes calculadas */}
      {r !== null && (
        <>
          <Text fontSize={0.17} color="#fbbf24" anchorX="left" position={[0, isHel ? -1.32 : -1.12, 0]}>
            {`r = mv⊥/|q|B = ${(r*1000).toFixed(2)} mm`}
          </Text>
          <Text fontSize={0.16} color="#94a3b8" anchorX="left" position={[0, isHel ? -1.55 : -1.35, 0]}>
            {`T = 2πm/|q|B = ${T_s ? (T_s*1e9).toFixed(1) : '—'} ns`}
          </Text>
          <Text fontSize={0.16} color="#94a3b8" anchorX="left" position={[0, isHel ? -1.78 : -1.58, 0]}>
            {`f = |q|B/2πm = ${f_Hz ? (f_Hz/1e6).toFixed(1) : '—'} MHz`}
          </Text>
          <Text fontSize={0.17} color="#ef4444" anchorX="left" position={[0, isHel ? -2.01 : -1.81, 0]}>
            {`|F| = |q|v⊥B = ${F_N.toExponential(2)} N`}
          </Text>
          <Text fontSize={0.15} color="#34d399" anchorX="left" position={[0, isHel ? -2.24 : -2.04, 0]}>
            {`Ec = ½mv² = ${KE.toExponential(2)} J  (cte.)`}
          </Text>
        </>
      )}

      {/* Separador */}
      <Line points={[new THREE.Vector3(0,-2.45,0), new THREE.Vector3(6,-2.45,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Leyenda */}
      <Text fontSize={0.14} color="#34d399" anchorX="left" position={[0, -2.65, 0]}>
        {'→ verde: v⃗ (velocidad)'}
      </Text>
      <Text fontSize={0.14} color="#ef4444" anchorX="left" position={[0, -2.83, 0]}>
        {'→ rojo: F⃗ (fuerza Lorentz)'}
      </Text>
      <Text fontSize={0.14} color="#06b6d4" anchorX="left" position={[0, -3.01, 0]}>
        {'— cyan: trayectoria'}
      </Text>
      <Text fontSize={0.14} color="#1e3a5f" anchorX="left" position={[0, -3.19, 0]}>
        {'— lineas: campo B en Z'}
      </Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
export function FuerzaLorentzScene({ B, charge, mass, v0x, v0z }: FuerzaLorentzProps) {
  const qB        = Math.abs(charge) * Math.abs(B)
  const hasPhys   = qB > 1e-30 && Math.abs(v0x) > 1e-6
  const r         = hasPhys ? (mass * Math.abs(v0x)) / qB : 1.5
  const isHelical = Math.abs(v0z) > 1e-4
  const pitchDist = isHelical ? 3.5 : 0

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 80, position: [4, -6, 9] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 8]} intensity={1.5} />
      <pointLight position={[5, 5, 4]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[-4, 4, 2]} intensity={0.4} color={charge >= 0 ? '#ef4444' : '#3b82f6'} />

      <BFieldLines B={B} />
      <BAxis B={B} />
      <OrbitPlane r={r} />
      <CyclotronCircle r={r} charge={charge} />
      {isHelical && <HelixPitchIndicator r={r} pitchDist={pitchDist} />}
      <OrbitParticle B={B} charge={charge} mass={mass} v0x={v0x} v0z={v0z} />
      <RegimeLabel isHelical={isHelical} charge={charge} />
      <LorentzHUD B={B} charge={charge} mass={mass} v0x={v0x} v0z={v0z} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={35} />
    </Canvas>
  )
}
