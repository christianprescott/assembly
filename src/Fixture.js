import { Body, Box, Vec3 } from 'cannon'
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial } from 'three'

const MAT_FIXTURE = DEBUG ?
  new MeshBasicMaterial({ color: 0x202020, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0x808080 })

export default class Fixture extends Mesh {
  static create (geometry) {
    if (!geometry) throw new Error('geometry must be present')

    geometry.computeBoundingBox()
    const position = geometry.boundingBox.getCenter()
    geometry.translate(...position.toArray().map(v => v * -1))

    if (DEBUG) {
      geometry = new BoxGeometry(...geometry.boundingBox.getSize().toArray())
      geometry.computeBoundingBox()
    }

    const size = geometry.boundingBox.getSize()
    const body = new Body({
      mass: 0,
      position: new Vec3(...position.toArray()),
      shape: new Box(new Vec3(...size.toArray().map(v => v / 2))),
    })

    const f = new Fixture(geometry, body)
    f.position.copy(position)
    return f
  }

  constructor (geometry, body) {
    super(
      geometry,
      MAT_FIXTURE,
    )
    this.castShadow = true
    this.receiveShadow = true

    this.body = body
  }
}
