import { Vector3 } from 'three'

export function add(a: Vector3, b: Vector3): Vector3 {
  return a.clone().add(b)
}

export function scale(v: Vector3, s: number): Vector3 {
  return v.clone().multiplyScalar(s)
}

export function normalize(v: Vector3): Vector3 {
  const len = v.length()
  if (len < 1e-10) return new Vector3(0, 0, 0)
  return v.clone().divideScalar(len)
}

export function magnitude(v: Vector3): number {
  return v.length()
}

/** Genera una esfera de puntos equidistribuidos usando golden spiral */
export function sphericalPoints(n: number, radius: number): Vector3[] {
  const points: Vector3[] = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2

  for (let i = 0; i < n; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / n)
    const phi = 2 * Math.PI * i / goldenRatio

    points.push(new Vector3(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta),
    ))
  }

  return points
}

/** Genera puntos en una grilla 3D para visualizar vectores de campo */
export function gridPoints3D(
  range: number,
  step: number,
): Vector3[] {
  const points: Vector3[] = []
  for (let x = -range; x <= range; x += step) {
    for (let y = -range; y <= range; y += step) {
      for (let z = -range; z <= range; z += step) {
        const r = Math.sqrt(x * x + y * y + z * z)
        if (r > 0.5 && r < range + 0.5) {
          points.push(new Vector3(x, y, z))
        }
      }
    }
  }
  return points
}
