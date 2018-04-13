import 'three/examples/js/loaders/OBJLoader'
import { OBJLoader } from 'three'
import Component from './Component'
import Fixture from './Fixture'
import Link from './Link'

export default class Assembly {
  static create (obj, config) {
    const group = new OBJLoader().parse(obj)

    // Key geometries by unique name
    const geometries = group.children.reduce((acc, m) => {
      const { name, geometry } = m
      if (!name) throw new Error('geometry must have a name')
      if (acc[name]) throw new Error(`duplicate geometry with name "${name}"`)
      acc[name] = geometry
      return acc
    }, {})

    // Map fixtures and components to instances of their class
    // Maintain a map of both types to connect links later
    function toGeometry (name) {
      const g = geometries[name]
      if (!g) throw new Error(`no geometry exists with name "${name}"`)
      return g
    }
    function toReducer (Type) {
      return (acc, [name, c]) => {
        const { objects, set } = acc
        if (objects[name]) throw new Error(`duplicate object with name "${name}"`)
        const meshes = c.meshes.map(toGeometry)
        const bodies = c.bodies.map(toGeometry)
        const object = Type.create(name, meshes, bodies)
        objects[name] = object
        set.push(object)
        return acc
      }
    }
    const objects = {}
    const fixtures = []
    const components = []
    Object.entries(config.fixtures).reduce(toReducer(Fixture), { objects, set: fixtures })
    Object.entries(config.components).reduce(toReducer(Component), { objects, set: components })

    // Create links between objects
    config.links.forEach((link) => {
      if (link.length !== 2) throw new Error('exactly two objects must be linked')
      const [nameA, nameB] = link
      Link.create(objects[nameA], objects[nameB])
    })

    return new Assembly(fixtures, components)
  }

  constructor (fixtures, components) {
    Object.assign(this, { fixtures, components })
  }
}
