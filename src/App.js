import { Body, Box, LockConstraint, Vec3, World } from 'cannon'
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
    world.allowSleep = true

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
      body.addEventListener('sleep', App._onBodySleep)
      world.addBody(body)
      c.body = body

      const dragBody = new Body({ position: body.position })
      world.addBody(dragBody)
      c.dragBody = dragBody

      const constraint = new LockConstraint(
        body,
        dragBody,
        // TODO: revisit force after revising drag
        { maxForce: 10 },
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
    dragControls.addEventListener('dragstart', App._onDragStart)
    dragControls.addEventListener('drag', App._onDrag)
    dragControls.addEventListener('dragend', App._onDragEnd)
    const cameraControls = new CameraControls(camera, renderer.domElement)
    cameraControls.enablePan = false

    this.assembly = assembly
  }

  start () {
    this.clock.start()
    this._animate()
  }

  fullscreen () {
    this.renderer.fullscreen()
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
    if (this.assembly) {
      this.assembly.components.forEach((c) => {
        c.position.copy(c.body.position)
        c.quaternion.copy(c.body.quaternion)
      })
    }
  }

  _render () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }

  static _onDragStart (event) {
    const component = event.object
    const { body } = component
    body.type = Body.DYNAMIC
    body.allowSleep = false
    body.wakeUp()
  }

  // TODO: only drag as far as can be raytraced from drag point
  // TODO: consider additional constraints for rotation
  // TODO: maybe reposition dragBody on release so it remains in place
  static _onDrag (event) {
    const component = event.object
    const { dragBody, position } = component
    dragBody.position.set(...position.toArray())
    component.testLinks()
  }

  static _onDragEnd (event) {
    const component = event.object
    const { body } = component
    body.allowSleep = true
    component.testLinks()
  }

  static _onBodySleep (event) {
    const body = event.target
    body.type = Body.STATIC
  }
}
