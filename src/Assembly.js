import Component from './Component'
import Fixture from './Fixture'

export default class Assembly {
  constructor () {
    this.fixtures = [
      new Fixture(),
    ]

    const component = new Component()
    component.position.set(3, 0, 0)
    this.components = [
      component,
    ]
  }
}
