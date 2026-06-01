import { Vector3 } from 'three'

export interface PointCharge {
  id: string
  position: Vector3
  charge: number   // Coulombs (usar nC en UI, convertir a C internamente)
  color?: string
}

export interface ElectricField {
  position: Vector3
  vector: Vector3
  magnitude: number
}

export interface SimulationState {
  charges: PointCharge[]
  showFieldLines: boolean
  showVectors: boolean
}

export interface FluxParams {
  area: number         // m²
  fieldMagnitude: number  // N/C
  angle: number        // grados
}

export interface GaussParams {
  radius: number       // m
  charge: number       // nC
}
