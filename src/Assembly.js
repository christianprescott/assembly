import { Vector3 } from 'three'
import Component from './Component'
import Fixture from './Fixture'
import Link from './Link'

export default class Assembly {
  static load () {
    const fixture = new Fixture()
    fixture.position.set(0, 0, -1)

    const componentA = new Component()
    componentA.position.set(-3, 0, 0.5)
    Link.create(fixture, componentA, new Vector3(0, 0, 1))

    const componentB = new Component()
    componentB.position.set(-2.5, 0, -0.5)
    Link.create(componentA, componentB, new Vector3(1, 0, 0))

    return new Assembly([fixture], [componentA, componentB])
  }

  constructor (fixtures, components) {
    Object.assign(this, { fixtures, components })
  }
}
