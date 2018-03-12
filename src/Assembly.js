import 'three/examples/js/loaders/OBJLoader'
import { OBJLoader } from 'three'
import Component from './Component'
import Fixture from './Fixture'
import Link from './Link'

export default class Assembly {
  static load (config) {
    // TODO: including contents of an entire .obj file in this object
    // is not awesome
    const group = new OBJLoader().parse(config.obj)

    const meshes = group.children.reduce((acc, m) => {
      const { name, geometry } = m
      if (!name) throw new Error('mesh must have a name')
      if (acc[name]) throw new Error(`duplicate mesh with name "${name}"`)
      const Type = config.fixtures.includes(name) ? Fixture : Component
      const mesh = Type.create(geometry)
      acc[name] = mesh
      return acc
    }, {})

    config.links.forEach((link) => {
      if (link.length !== 2) throw new Error('exactly two meshes must be linked')
      const [nameA, nameB] = link
      Link.create(meshes[nameA], meshes[nameB])
    })

    const { fixtures, components } = Object.entries(meshes).reduce((acc, [name, m]) => {
      const collection = config.fixtures.includes(name) ? acc.fixtures : acc.components
      collection.push(m)
      return acc
    }, { fixtures: [], components: [] })
    return new Assembly(fixtures, components)
  }

  constructor (fixtures, components) {
    Object.assign(this, { fixtures, components })
  }
}
