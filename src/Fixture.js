import { Mesh, MeshToonMaterial } from 'three'

export default class Fixture extends Mesh {
  constructor (geometry) {
    if (!geometry) throw new Error('geometry must be present')
    super(
      geometry,
      new MeshToonMaterial({ color: 0x808080 }),
    )
    this.castShadow = true
    this.receiveShadow = true

    this.body = null
  }
}
