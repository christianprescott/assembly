import { Mesh, MeshBasicMaterial, MeshToonMaterial } from 'three'

const MAT_COMPONENT = DEBUG ?
  new MeshBasicMaterial({ color: 0xa0a0a0, opacity: 0.3, transparent: true, wireframe: true }) :
  new MeshToonMaterial({ color: 0xff0000 })

export default class Component extends Mesh {
  constructor (geometry) {
    if (!geometry) throw new Error('geometry must be present')
    super(
      geometry,
      MAT_COMPONENT,
    )
    this.castShadow = true
    this.receiveShadow = true

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
        component.links.find((l) => {
          const dist = l.getDistance()
          return dist < 0.05
        })
        // TODO: raise linked event
      })
  }
}
