import { Vec3 } from 'cannon'
import { Vector3 } from 'three'

// TODO: scale may need adjusting based on assembly
export const CANNON_SCALE = 10.0

export function toCannon (threeVector, target) {
  target = target || new Vec3()
  target.set(...threeVector.toArray().map(v => v * CANNON_SCALE))
  return target
}

export function toThree (cannonVector, target) {
  target = target || new Vector3()
  target.set(...cannonVector.toArray().map(v => v / CANNON_SCALE))
  return target
}
