import { Box, Quaternion as CannonQuaternion, Vec3 } from 'cannon'
import { Geometry, Quaternion, Vector3 } from 'three'
import { toCannon } from './scale'

function testForBox (geometry, vertexConnectedFaces) {
  // Reject geometry without exactly 8 vertices
  if (Object.keys(vertexConnectedFaces).length !== 8) return false

  const diff1 = new Vector3()
  const diff2 = new Vector3()
  const { vertices } = geometry
  // Count vertices with angles to adjacent edges totalling 270 degrees.
  // This sum logic could fail if internal geometry is present to create
  // additional angles, but should be solid for well-formed boxes.
  return Object.keys(vertexConnectedFaces).every((aIndex) => {
    // For corner vA...
    const vA = vertices[aIndex]
    const connectedFaces = vertexConnectedFaces[aIndex]
    // ...sum the angles formed by each pair of vertices connected by a face...
    const cornerSum = connectedFaces.reduce((sum, [bIndex, cIndex]) => {
      const vB = vertices[bIndex]
      const vC = vertices[cIndex]
      diff1.subVectors(vB, vA)
      diff2.subVectors(vC, vA)
      const angle = diff1.angleTo(diff2)
      return sum + angle
    }, 0)
    // ...and ensure it totals three right angles.
    return Math.abs(cornerSum - ((3 * Math.PI) / 2)) < 0.01
  })
}

export default function shapeFromGeometry (bufferGeometry) {
  const geometry = new Geometry().fromBufferGeometry(bufferGeometry)
  geometry.mergeVertices()
  geometry.computeBoundingBox()
  const center = geometry.boundingBox.getCenter()
  const offset = toCannon(center)

  // Build map of vertex to vertices connected by adjacent faces
  const vertexConnectedFaces = {}
  geometry.faces.forEach((face) => {
    if (vertexConnectedFaces[face.a] === undefined) vertexConnectedFaces[face.a] = []
    vertexConnectedFaces[face.a].push([face.b, face.c])
    if (vertexConnectedFaces[face.b] === undefined) vertexConnectedFaces[face.b] = []
    vertexConnectedFaces[face.b].push([face.a, face.c])
    if (vertexConnectedFaces[face.c] === undefined) vertexConnectedFaces[face.c] = []
    vertexConnectedFaces[face.c].push([face.a, face.b])
  })

  if (testForBox(geometry, vertexConnectedFaces)) {
    const diff1 = new Vector3()
    const diff2 = new Vector3()
    const { vertices } = geometry
    // Pick a vertex - any vertex - and use its adjacent corners to determine extents
    const [aIndex, connectedFaces] = Object.entries(vertexConnectedFaces)[0]
    const vA = vertices[aIndex]
    const connectedVertices = connectedFaces.reduce((acc, [a, b]) => {
      if (!acc.includes(a)) acc.push(a)
      if (!acc.includes(b)) acc.push(b)
      return acc
    }, [])

    // Our box geometry is formed of tris, connected vertices will include more
    // than just those at adjacent corners. Select a set of three vertices at
    // right angles to each other through the corner.
    let extentIndices = []
    connectedVertices.some((bIndex) => {
      const vB = vertices[bIndex]
      diff1.subVectors(vB, vA)
      const rightTo = connectedVertices.filter((cIndex) => {
        const vC = vertices[cIndex]
        diff2.subVectors(vC, vA)
        const angle = diff1.angleTo(diff2)
        return Math.abs(angle - (Math.PI / 2)) < 0.01
      })
      if (rightTo.length === 2) {
        extentIndices = rightTo.concat(bIndex)
        return true
      }
      return false
    })

    const vX = vertices[extentIndices[0]].clone().sub(vA)
    const vY = vertices[extentIndices[1]].clone().sub(vA)
    const vZ = vertices[extentIndices[2]].clone().sub(vA)
    const halfExtents = toCannon(new Vector3(vX.length(), vY.length(), vZ.length()).divideScalar(2))
    const shape = new Box(halfExtents)
    // Rotate box to align the X axis with the geometry...
    const alignX = new Quaternion()
    const alignXAxis = new Vector3(1, 0, 0).cross(vX).normalize()
    if (alignXAxis.length() > 0) {
      alignX.setFromAxisAngle(alignXAxis, new Vector3(1, 0, 0).angleTo(vX))
    }
    // ...then the Y, rotating around the aligned-X axis...
    const alignY = new Quaternion().setFromAxisAngle(
      vX.clone().normalize(),
      new Vector3(0, 1, 0).applyQuaternion(alignX).angleTo(vY),
    )
    const orientation = new CannonQuaternion(...alignY.multiply(alignX).toArray())
    // ...then we're done! Since the third axis is right to X and Y.

    return { shape, offset, orientation }
  }

  // Not recognized as a supported shape - return a simple bounding box
  const size = geometry.boundingBox.getSize()
  const shape = new Box(toCannon(size.divideScalar(2)))
  const orientation = new CannonQuaternion()
  return { shape, offset, orientation }
}
