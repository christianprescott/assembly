import { Body, LockConstraint, World } from 'cannon'
import { Clock, PerspectiveCamera } from 'three'
import buildScene from './buildScene'
import DragControls from './DragControls'
import CameraControls from './CameraControls'
import ResponsiveRenderer from './ResponsiveRenderer'
import RotateControls from './RotateControls'

export default class App {
  clock = new Clock(false)

  constructor (parent) {
    const renderer = new ResponsiveRenderer(parent)
    renderer.shadowMap.enabled = true
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

    assembly.components.forEach((c) => {
      scene.add(c)
      c.body.addEventListener('sleep', App._onBodySleep)
      world.addBody(c.body)
      world.addBody(c.dragBody)

      const constraint = new LockConstraint(
        c.body,
        c.dragBody,
        // TODO: revisit force after revising drag
        { maxForce: 10 },
      )
      world.addConstraint(constraint)
    })

    assembly.fixtures.forEach((f) => {
      scene.add(f)
      world.addBody(f.body)
    })

    const dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    dragControls.addEventListener('dragstart', App._onDragStart)
    dragControls.addEventListener('drag', App._onDrag)
    dragControls.addEventListener('dragend', App._onDragEnd)
    const rotateControls = new RotateControls(assembly.components, camera, renderer.domElement)
    rotateControls.addEventListener('rotatestart', App._onDragStart)
    rotateControls.addEventListener('rotate', App._onRotate)
    rotateControls.addEventListener('rotateend', App._onDragEnd)
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
  }

  static _onBodySleep (event) {
    const body = event.target
    body.type = Body.STATIC
    body.component.testLinks()
  }

  static _onRotate (event) {
    const component = event.object
    const { dragBody, quaternion } = component
    dragBody.quaternion.set(...quaternion.toArray())
  }
}
