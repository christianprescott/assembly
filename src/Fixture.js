import { Mesh, MeshBasicMaterial, MeshToonMaterial } from 'three'

const MAT_FIXTURE = DEBUG ?
  new MeshBasicMaterial({ color: 0x202020, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0x808080 })

export default class Fixture extends Mesh {
  constructor (geometry) {
    if (!geometry) throw new Error('geometry must be present')
    super(
      geometry,
      MAT_FIXTURE,
    )
    this.castShadow = true
    this.receiveShadow = true

    this.body = null
  }
}
