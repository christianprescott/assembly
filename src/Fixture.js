import { Body, Box, Vec3 } from 'cannon'
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial, Object3D } from 'three'

const MAT_FIXTURE = DEBUG ?
  new MeshBasicMaterial({ color: 0x202020, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0x808080 })

export default class Fixture extends Object3D {
  static create (meshGeometries, bodyGeometries) {
    const object = new Fixture()

    // Add meshes to the object
    meshGeometries.forEach((geometry) => {
      const mesh = new Mesh(geometry, MAT_FIXTURE)
      mesh.castShadow = true
      mesh.receiveShadow = true
      object.add(mesh)
    })

    // Position geometries around object center
    const box = new Box3().setFromObject(object)
    const position = box.getCenter()
    new Set(meshGeometries.concat(bodyGeometries)).forEach((geometry) => {
      geometry.translate(...position.toArray().map(v => v * -1))
    })

    // Add collision bodies to the object
    bodyGeometries.forEach((geometry) => {
      geometry.computeBoundingBox()
      const size = geometry.boundingBox.getSize()
      const center = geometry.boundingBox.getCenter()
      const shape = new Box(new Vec3(...size.toArray().map(v => v / 2)))
      const offset = new Vec3(...center.toArray())
      object.body.addShape(shape, offset)
    })

    if (DEBUG) {
      // Drain meshes from object
      object.remove(...object.children)
      object.body.shapes.forEach((shape, i) => {
        const offset = object.body.shapeOffsets[i]
        const mesh = new Mesh(
          new BoxGeometry(...shape.halfExtents.toArray().map(s => s * 2)),
          MAT_FIXTURE,
        )
        mesh.position.set(...offset.toArray())
        object.add(mesh)
      })
    }

    object.position.copy(position)
    object.body.position.set(...position.toArray())
    return object
  }

  constructor () {
    super()

    this.body = new Body({
      mass: 0,
    })
  }
}
