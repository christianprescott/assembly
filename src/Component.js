import { BoxGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three'

export default class Component extends Mesh {
  constructor () {
    super(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: 0xff0000 }),
    )

    this.target = new Vector3(0, 0, 1)
  }
}
