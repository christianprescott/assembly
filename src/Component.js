import { Mesh, MeshToonMaterial } from 'three'

const MAT_LINKED = new MeshToonMaterial({ color: 0x00ff00 })
const MAT_UNLINKED = new MeshToonMaterial({ color: 0xff0000 })

export default class Component extends Mesh {
  constructor (geometry) {
    if (!geometry) throw new Error('geometry must be present')
    super(
      geometry,
      MAT_UNLINKED,
    )
    this.links = []
    this.body = null
    this.dragBody = null
  }

  testLinks () {
    const meshes = this.links.reduce((acc, l) => {
      l.meshes().forEach(m => acc.add(m))
      return acc
    }, new Set())

    Array.from(meshes.values())
      .filter(m => m instanceof Component)
      .forEach((component) => {
        const linked = component.links.find((l) => {
          const dist = l.getDistance()
          return dist < 0.05
        })
        component.material = linked ? MAT_LINKED : MAT_UNLINKED
      })
  }
}
