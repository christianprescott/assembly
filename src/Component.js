import { Body } from 'cannon'
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial, Object3D } from 'three'
import shapeFromGeometry from './shapeFromGeometry'

const MAT_COMPONENT = DEBUG ?
  new MeshBasicMaterial({ color: 0xa0a0a0, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0xff0000 })

export default class Component extends Object3D {
  static create (meshGeometries, bodyGeometries) {
    const object = new Component()

    // Add meshes to the object
    meshGeometries.forEach((geometry) => {
      const mesh = new Mesh(geometry, MAT_COMPONENT)
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
          new BoxGeometry(...shape.halfExtents.toArray().map(s => s * 2)),
          MAT_COMPONENT,
        )
        mesh.position.set(...offset.toArray())
        mesh.quaternion.set(...orientation.toArray())
        object.add(mesh)
      })
    }

    object.position.copy(position)
    object.body.position.set(...position.toArray())
    object.dragBody.position.set(...position.toArray())
    return object
  }

  constructor () {
    super()

    this.links = []
    this.body = new Body({
      angularDamping: 0.8,
      mass: 5,
    })
    // Link Component for reference from events
    this.body.component = this
    this.dragBody = new Body()
  }

  testLinks () {
    const objects = this.links.reduce((acc, l) => {
      l.objects().forEach(m => acc.add(m))
      return acc
    }, new Set())

    Array.from(objects.values())
      .filter(m => m instanceof Component)
      .forEach((component) => {
        component.links.find(l => l.test())
        // TODO: raise linked event
      })
  }
}
