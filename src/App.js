import { Clock, Scene, PerspectiveCamera } from 'three'
import DragControls from './DragControls'
import ResponsiveRenderer from './ResponsiveRenderer'
import Assembly from './Assembly'

export default class App {
  clock = new Clock(false)

  constructor (parent) {
    const renderer = new ResponsiveRenderer(parent)

    const scene = new Scene()

    const camera = new PerspectiveCamera(45, 1, 1, 1000)
    camera.position.set(0, -10, 0)
    camera.rotation.set(Math.PI / 2, 0, 0)
    scene.add(camera)

    const assembly = new Assembly()
    scene.add(...assembly.fixtures)
    scene.add(...assembly.components)

    const dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    dragControls.addEventListener('drag', App._onDrag)

    Object.assign(this, { renderer, scene, camera })
  }

  start () {
    this.clock.start()
    this._animate()
  }

  // private

  _animate = () => {
    requestAnimationFrame(this._animate)
    this._render()
  }

  _render () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }

  static _onDrag (event) {
    const component = event.object
    component.testLinks()
  }
}
