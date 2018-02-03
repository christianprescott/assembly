import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three'

export default class Fixture extends Mesh {
  constructor () {
    super(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: 0x808080 }),
    )
  }
}
