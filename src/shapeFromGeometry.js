import { Box, Quaternion, Vec3 } from 'cannon'

export default function shapeFromGeometry (geometry) {
  geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize()
  const center = geometry.boundingBox.getCenter()
  const shape = new Box(new Vec3(...size.toArray().map(v => v / 2)))
  const offset = new Vec3(...center.toArray())
  // TODO: determine orienation from body geometry
  const orientation = new Quaternion()
  return { shape, offset, orientation }
}
