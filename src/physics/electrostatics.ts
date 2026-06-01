import { Vector3 } from 'three'
import { K_COULOMB, MIN_DISTANCE, NC_TO_C } from './constants'
import type { PointCharge } from '../types/physics'

/**
 * Calcula el campo eléctrico en 'position' producido por todas las cargas.
 * Las cargas están en nC — se convierten a C internamente.
 * Retorna el vector E en N/C (pero escalado para visualización).
 */
export function electricField(
  position: Vector3,
  charges: PointCharge[],
): Vector3 {
  const E = new Vector3(0, 0, 0)

  for (const charge of charges) {
    const r = position.clone().sub(charge.position)
    const dist = r.length()
    if (dist < MIN_DISTANCE) continue

    const q = charge.charge * NC_TO_C  // nC → C
    const magnitude = (K_COULOMB * q) / (dist * dist)
    E.addScaledVector(r.normalize(), magnitude)
  }

  return E
}

/**
 * Magnitud del campo eléctrico en N/C a una distancia r de una carga q (nC).
 */
export function fieldMagnitudeAt(q_nC: number, r_m: number): number {
  if (r_m < MIN_DISTANCE) return Infinity
  return (K_COULOMB * Math.abs(q_nC) * NC_TO_C) / (r_m * r_m)
}

/**
 * Calcula una línea de campo usando integración de Euler.
 * Parte desde 'start' y sigue la dirección del campo eléctrico.
 * direction = 1 → sigue el campo (desde +), -1 → contra el campo (hacia -)
 */
export function traceFieldLine(
  start: Vector3,
  charges: PointCharge[],
  direction: 1 | -1 = 1,
  steps = 400,
  stepSize = 0.06,
  maxDist = 9,
): Vector3[] {
  const points: Vector3[] = [start.clone()]
  let current = start.clone()

  for (let i = 0; i < steps; i++) {
    const E = electricField(current, charges)
    const mag = E.length()

    if (mag < 1e-4) break

    E.normalize().multiplyScalar(direction * stepSize)
    current = current.clone().add(E)
    points.push(current.clone())

    if (current.length() > maxDist) break

    // Terminar si llegamos cerca de una carga negativa (absorbida)
    for (const charge of charges) {
      if (charge.charge < 0 && current.distanceTo(charge.position) < 0.2) {
        return points
      }
    }
  }

  return points
}

/**
 * Genera un conjunto de líneas de campo que parten de una carga positiva
 * en múltiples direcciones distribuidas esféricamente.
 */
export function generateFieldLines(
  charges: PointCharge[],
  linesPerCharge = 24,
): Vector3[][] {
  const lines: Vector3[][] = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const startRadius = 0.25

  for (const charge of charges) {
    if (charge.charge <= 0) continue

    for (let i = 0; i < linesPerCharge; i++) {
      const theta = Math.acos(1 - (2 * (i + 0.5)) / linesPerCharge)
      const phi = 2 * Math.PI * i / goldenRatio

      const start = new Vector3(
        charge.position.x + startRadius * Math.sin(theta) * Math.cos(phi),
        charge.position.y + startRadius * Math.sin(theta) * Math.sin(phi),
        charge.position.z + startRadius * Math.cos(theta),
      )

      const line = traceFieldLine(start, charges, 1)
      if (line.length > 2) lines.push(line)
    }
  }

  return lines
}

/**
 * Flujo eléctrico: Φ = E · A · cos(θ)
 */
export function electricFlux(
  E: number,
  A: number,
  theta_deg: number,
): number {
  return E * A * Math.cos((theta_deg * Math.PI) / 180)
}

/**
 * Flujo total por Ley de Gauss: Φ = q_enc / ε₀
 */
export function gaussianFlux(q_nC: number): number {
  const EPSILON_0 = 8.854187817e-12
  return (q_nC * 1e-9) / EPSILON_0
}

/**
 * Potencial eléctrico en un punto dado un conjunto de cargas (nC).
 * V = Σ k·q/r  [Voltios]
 */
export function electricPotential(
  position: Vector3,
  charges: PointCharge[],
): number {
  let V = 0
  for (const charge of charges) {
    const r = position.distanceTo(charge.position)
    if (r < MIN_DISTANCE) continue
    V += (K_COULOMB * charge.charge * NC_TO_C) / r
  }
  return V
}
