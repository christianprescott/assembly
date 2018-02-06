import { Mesh, Object3D, Vector3 } from 'three'
import Component from './Component'

export default class Link extends Object3D {
  static create (meshA, meshB, offset) {
    if (![meshA, meshB].every(m => m instanceof Mesh)) throw new Error('meshes must be present')
    if (meshA === meshB) throw new Error('cannot link mesh to itself')
    if (!(offset instanceof Vector3)) throw new Error('offset must be present')

    return new Link(meshA, meshB, offset)
  }

  constructor (meshA, meshB, offset) {
    super()
    Object.assign(this, { meshA, meshB })

    this.position.set(...offset.toArray())
    meshA.add(this)

    this.meshes()
      .filter(m => m instanceof Component)
      .forEach(c => c.links.push(this))
  }

  meshes () {
    return [this.meshA, this.meshB]
  }

  getDistance () {
    return this.getWorldPosition().distanceTo(this.meshB.position)
  }
}
