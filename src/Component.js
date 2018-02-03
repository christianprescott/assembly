import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three'

const MAT_LINKED = new MeshBasicMaterial({ color: 0x00ff00 })
const MAT_UNLINKED = new MeshBasicMaterial({ color: 0xff0000 })

export default class Component extends Mesh {
  constructor () {
    super(
      new BoxGeometry(1, 1, 1),
      MAT_UNLINKED,
    )
    this.links = []
  }

  testLinks () {
    const meshes = this.links.reduce((acc, l) => {
      acc.add(l.meshA)
      acc.add(l.meshB)
      return acc
    }, new Set())

    meshes.forEach((mesh) => {
      if (Array.isArray(mesh.links)) {
        const linked = mesh.links.find((l) => {
          const dist = l.getDistance()
          return dist < 0.05
        })
        mesh.material = linked ? MAT_LINKED : MAT_UNLINKED
      }
    })
  }
}
