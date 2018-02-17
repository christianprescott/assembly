import { Body, Box, PointToPointConstraint, Vec3, World } from 'cannon'
import { Clock, PerspectiveCamera } from 'three'
import buildScene from './buildScene'
import DragControls from './DragControls'
import CameraControls from './CameraControls'
import ResponsiveRenderer from './ResponsiveRenderer'

export default class App {
  clock = new Clock(false)

  constructor (parent) {
    const renderer = new ResponsiveRenderer(parent)
    const camera = new PerspectiveCamera(45, 1, 1, 1000)
    camera.up.set(0, 0, 1)
    camera.position.set(0, -10, 0)
    camera.rotation.set(Math.PI / 2, 0, 0)
    const scene = buildScene()

    const world = new World()
    world.gravity.set(0, 0, 0)

    Object.assign(this, { camera, renderer, scene, world })
  }

  // TODO: clear previous contents, controls
  load (assembly) {
    const { camera, scene, renderer, world } = this
    scene.add(...assembly.fixtures)
    scene.add(...assembly.components)

    assembly.components.forEach((c) => {
      const body = new Body({
        angularDamping: 0.8,
        mass: 5,
        position: new Vec3(...c.position.toArray()),
        shape: new Box(new Vec3(...c.geometry.boundingBox.getSize().toArray().map(v => v / 2))),
      })
      world.addBody(body)
      c.body = body

      const dragBody = new Body({ position: body.position })
      world.addBody(dragBody)
      c.dragBody = dragBody

      const constraint = new PointToPointConstraint(
        body,
        new Vec3(0, 0, 0),
        dragBody,
        new Vec3(0, 0, 0),
        // TODO: revisit force after revising drag
        10,
      )
      world.addConstraint(constraint)
    })

    assembly.fixtures.forEach((c) => {
      const body = new Body({
        mass: 0,
        position: new Vec3(...c.position.toArray()),
        shape: new Box(new Vec3(...c.geometry.boundingBox.getSize().toArray().map(v => v / 2))),
      })
      world.addBody(body)
      c.body = body
    })

    const dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    dragControls.addEventListener('drag', App._onDrag)
    const cameraControls = new CameraControls(camera, renderer.domElement)
    cameraControls.enablePan = false

    this.assembly = assembly
  }

  start () {
    this.clock.start()
    this._animate()
  }

  // private

  _animate = () => {
    requestAnimationFrame(this._animate)
    const dt = this.clock.getDelta()
    this._update(dt)
    this._render()
  }

  _update (dt) {
    this.world.step(dt)
    this.assembly.components.forEach((c) => {
      c.position.copy(c.body.position)
      c.quaternion.copy(c.body.quaternion)
    })
  }

  _render () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }

  // TODO: only drag as far as can be raytraced from drag point
  // TODO: consider additional constraints for rotation
  // TODO: maybe reposition dragBody on release so it remains in place
  static _onDrag (event) {
    const component = event.object
    const { dragBody, position } = component
    dragBody.position.set(...position.toArray())
    // TODO: hm using THREE position allows you to "drag" the component anywhere
    // even where CANNON won't let you. needs work.
    component.testLinks()
  }
}
