import { Mesh, Object3D } from 'three'
import Component from './Component'

export default class Link extends Object3D {
  static create (meshA, meshB) {
    const meshes = [meshA, meshB]
    if (!meshes.every(m => m instanceof Mesh)) throw new Error('meshes must be present')
    if (meshA === meshB) throw new Error('cannot link mesh to itself')

    const componentIndex = meshes.findIndex(m => m instanceof Component)
    if (componentIndex < 0) throw new Error('cannot link two fixtures')
    const component = meshes[componentIndex]
    const other = meshes[1 - componentIndex]
    const notLinked = component.links.every(l => !l.meshes().includes(other))
    if (!notLinked) throw new Error('these meshes are already linked')

    return new Link(meshA, meshB)
  }

  constructor (meshA, meshB) {
    super()
    Object.assign(this, { meshA, meshB })

    this.position.subVectors(meshB.position, meshA.position)
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
