import { Mesh, MeshBasicMaterial } from 'three'

export default class Fixture extends Mesh {
  constructor (geometry) {
    if (!geometry) throw new Error('geometry must be present')
    super(
      geometry,
      new MeshBasicMaterial({ color: 0x808080 }),
    )
    this.body = null
  }
}
