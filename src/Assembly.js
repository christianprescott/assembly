import 'three/examples/js/loaders/OBJLoader'
import { OBJLoader, Vector3 } from 'three'
import Component from './Component'
import Fixture from './Fixture'
import Link from './Link'

export default class Assembly {
  static load (config) {
    // TODO: including contents of an entire .obj file in this object
    // is not awesome
    const group = new OBJLoader().parse(config.obj)

    // TODO: ensure no duplicate object names
    // TODO: ensure name present
    const meshes = group.children.reduce((acc, m) => {
      acc[m.name] = m
      return acc
    }, {})

    // TODO: ensure presence in only one type, or just infer components from !fixtures
    const fixtures = config.fixtures.map((name) => {
      const fixture = new Fixture()
      // TODO: ensure name present in meshes
      fixture.geometry = meshes[name].geometry
      meshes[name] = fixture
      return fixture
    })
    const components = config.components.map((name) => {
      const component = new Component()
      component.geometry = meshes[name].geometry
      meshes[name] = component
      return component
    })
    config.links.forEach(([nameA, nameB]) => {
      // TODO: ensure both are not fixtures
      // TODO: I think this only works cause meshes are offset from object
      // position. Might need repair.
      Link.create(meshes[nameA], meshes[nameB], new Vector3(0, 0, 0))
    })

    return new Assembly(fixtures, components)
  }

  constructor (fixtures, components) {
    Object.assign(this, { fixtures, components })
  }
}
