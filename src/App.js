import { Body, LockConstraint, World } from 'cannon'
import { BoxGeometry, Clock, Mesh, Object3D, PerspectiveCamera } from 'three'
import VRButton from './VRButton'
import buildScene from './buildScene'
import DragControls from './DragControls'
import CameraControls from './CameraControls'
import ResponsiveRenderer from './ResponsiveRenderer'
import RotateControls from './RotateControls'
import TouchControls from './TouchControls'

export default class App {
  assembly = null
  camera = null
  clock = new Clock(false)
  controls = []
  renderer = null
  scene = null
  world = null

  constructor (parent) {
    this.renderer = new ResponsiveRenderer(parent)
    this.renderer.shadowMap.enabled = true
    this.scene = buildScene()
    this._initPancake()

    this.world = new World()
    this.world.gravity.set(0, 0, 0)
    this.world.allowSleep = true

    const vrButton = new VRButton(parent, this.renderer)
    vrButton.addEventListener('enter', this._onVRPresent)
    vrButton.addEventListener('exit', this._onVRExit)
  }

  load (assembly) {
    const { camera, scene, renderer, world } = this

    if (this.assembly) this._unload(this.assembly)

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

    // TODO: include these in controls disabled for VR
    // TODO: initialize these and other controls only on start
    this.dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    this.dragControls.addEventListener('dragstart', App._onDragStart)
    this.dragControls.addEventListener('drag', App._onDrag)
    this.dragControls.addEventListener('dragend', App._onDragEnd)
    this.rotateControls = new RotateControls(assembly.components, camera, renderer.domElement)
    this.rotateControls.addEventListener('rotatestart', App._onDragStart)
    this.rotateControls.addEventListener('rotate', App._onRotate)
    this.rotateControls.addEventListener('rotateend', App._onDragEnd)

    this.assembly = assembly
  }

  start () {
    this.clock.start()
    this.renderer.animate(this._animate)
  }

  fullscreen () {
    this.renderer.fullscreen()
  }

  // private

  _unload (assembly) {
    const { scene, world } = this

    this.dragControls.removeEventListener('dragstart', App._onDragStart)
    this.dragControls.removeEventListener('drag', App._onDrag)
    this.dragControls.removeEventListener('dragend', App._onDragEnd)
    this.dragControls.deactivate()
    this.rotateControls.removeEventListener('rotatestart', App._onDragStart)
    this.rotateControls.removeEventListener('rotate', App._onRotate)
    this.rotateControls.removeEventListener('rotateend', App._onDragEnd)
    this.rotateControls.deactivate()

    assembly.fixtures.forEach((f) => {
      scene.remove(f)
      world.removeBody(f.body)
    })

    assembly.components.forEach((c) => {
      scene.remove(c)
      c.body.removeEventListener('sleep', App._onBodySleep)
      world.removeBody(c.body)
      world.removeBody(c.dragBody)

      world.constraints.forEach(con => world.removeConstraint(con))
    })

    this.assembly = null
  }

  _animate = () => {
    const dt = this.clock.getDelta()
    this._update(dt)
    this._render()
  }

  _update (dt) {
    this.controls.forEach(c => c.update())
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

  // TODO: this state toggle is in desperate need of refactor
  _onVRPresent = () => {
    this.controls.forEach(c => c.dispose())
    this._initVR()
  }

  _onVRExit = () => {
    this.controls.forEach(c => c.dispose())
    this.camera.parent.parent.remove(this.camera.parent)
    this._initPancake()
  }

  _initPancake () {
    // TODO: dispose previous VR controls
    const camera = new PerspectiveCamera(45, 1, 0.05, 1000)
    camera.up.set(0, 0, 1)
    camera.position.set(0, -10, 0)
    camera.rotation.set(Math.PI / 2, 0, 0)
    const cameraControls = new CameraControls(camera, this.renderer.domElement)
    cameraControls.enablePan = false
    this.controls = [cameraControls]
    this.camera = camera
  }

  _initVR () {
    const dolly = new Object3D()
    // TODO: set antialias, setPixelRatio, setSize, userHeight, standingMatrix
    // TODO: events: resize vrdisplaypointerrestricted vrdisplaypointerunrestricted
    // TODO: consider FOV changes
    const camera = new PerspectiveCamera(45, 1, 0.05, 1000)
    dolly.up.set(0, 0, 1)
    dolly.position.set(0, -4, 2)
    dolly.rotation.set(Math.PI / 2, 0, 0)
    dolly.add(camera)

    const [touchL, touchR] = [0, 1].map((index) => {
      const touch = new TouchControls(index, this.assembly.components)
      touch.addEventListener('dragstart', App._onDragStart)
      touch.addEventListener('drag', App._onDrag)
      touch.addEventListener('dragend', App._onDragEnd)
      touch.addEventListener('rotate', App._onRotate)
      const box = new Mesh(new BoxGeometry(0.02, 0.02, 0.02))
      touch.add(box)
      dolly.add(touch)
      return touch
    })

    this.scene.add(dolly)
    this.controls = [touchL, touchR]
    this.camera = camera
  }
}
