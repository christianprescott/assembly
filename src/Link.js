import { Object3D, Vector3 } from 'three'

export default class Link extends Object3D {
  static create (meshA, meshB, offset) {
    if (![meshA, meshB].every(m => m instanceof Object3D)) throw new Error('meshes must be present')
    if (meshA === meshB) throw new Error('cannot link mesh to itself')
    if (!(offset instanceof Vector3)) throw new Error('offset must be present')

    return new Link(meshA, meshB, offset)
  }

  constructor (meshA, meshB, offset) {
    super()
    Object.assign(this, { meshA, meshB })

    this.position.set(...offset.toArray())
    meshA.add(this)
    if (Array.isArray(meshA.links)) meshA.links.push(this)
    if (Array.isArray(meshB.links)) meshB.links.push(this)
  }

  getDistance () {
    return this.getWorldPosition().distanceTo(this.meshB.position)
  }
}
