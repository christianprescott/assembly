import { Body } from 'cannon'
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial, Object3D } from 'three'
import shapeFromGeometry from './shapeFromGeometry'
import { toCannon, toThree } from './scale'

const MAT_FIXTURE = DEBUG ?
  new MeshBasicMaterial({ color: 0x202020, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0x808080 })

export default class Fixture extends Object3D {
  static create (name, meshGeometries, bodyGeometries) {
    const object = new Fixture()
    object.name = name

    // Add meshes to the object
    meshGeometries.forEach((geometry) => {
      const mesh = new Mesh(geometry, MAT_FIXTURE.clone())
      mesh.castShadow = true
      mesh.receiveShadow = true
      object.add(mesh)
      object.meshes.push(mesh)
    })

    // Position geometries around object center
    const box = new Box3().setFromObject(object)
    const position = box.getCenter()
    new Set(meshGeometries.concat(bodyGeometries)).forEach((geometry) => {
      geometry.translate(...position.toArray().map(v => v * -1))
    })

    // Add collision bodies to the object
    bodyGeometries.forEach((geometry) => {
      const { shape, offset, orientation } = shapeFromGeometry(geometry)
      object.body.addShape(shape, offset, orientation)
    })

    if (DEBUG) {
      // Drain meshes from object
      object.remove(...object.children)
      object.body.shapes.forEach((shape, i) => {
        const offset = object.body.shapeOffsets[i]
        const orientation = object.body.shapeOrientations[i]
        const mesh = new Mesh(
          new BoxGeometry(...toThree(shape.halfExtents).multiplyScalar(2).toArray()),
          MAT_FIXTURE,
        )
        toThree(offset, mesh.position)
        mesh.quaternion.set(...orientation.toArray())
        object.add(mesh)
      })
    }

    object.position.copy(position)
    toCannon(position, object.body.position)
    return object
  }

  meshes = []
  body = new Body({ mass: 0 })
}
