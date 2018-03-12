import { Body, Box, Vec3 } from 'cannon'
import { Mesh, MeshBasicMaterial, MeshToonMaterial } from 'three'

const MAT_COMPONENT = DEBUG ?
  new MeshBasicMaterial({ color: 0xa0a0a0, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0xff0000 })

export default class Component extends Mesh {
  static create (geometry) {
    if (!geometry) throw new Error('geometry must be present')

    geometry.computeBoundingBox()
    const position = geometry.boundingBox.getCenter()
    geometry.translate(...position.toArray().map(v => v * -1))

    const size = geometry.boundingBox.getSize()
    const body = new Body({
      angularDamping: 0.8,
      mass: 5,
      position: new Vec3(...position.toArray()),
      shape: new Box(new Vec3(...size.toArray().map(v => v / 2))),
    })

    const dragBody = new Body({ position: body.position })

    const c = new Component(geometry, body, dragBody)
    c.position.copy(position)
    return c
  }

  constructor (geometry, body, dragBody) {
    super(
      geometry,
      MAT_COMPONENT,
    )
    this.castShadow = true
    this.receiveShadow = true

    this.links = []
    // Link Component for reference from events
    body.component = this
    this.body = body
    this.dragBody = dragBody
  }

  testLinks () {
    const meshes = this.links.reduce((acc, l) => {
      l.meshes().forEach(m => acc.add(m))
      return acc
    }, new Set())

    Array.from(meshes.values())
      .filter(m => m instanceof Component)
      .forEach((component) => {
        component.links.find((l) => {
          const dist = l.getDistance()
          return dist < 0.05
        })
        // TODO: raise linked event
      })
  }
}
