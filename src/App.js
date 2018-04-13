import { Body, LockConstraint, World } from 'cannon'
import { Clock, EventDispatcher, Object3D, PerspectiveCamera } from 'three'
import VRButton from './VRButton'
import buildScene from './buildScene'
import DragControls from './DragControls'
import CameraControls from './CameraControls'
import ResponsiveRenderer from './ResponsiveRenderer'
import RotateControls from './RotateControls'
import TouchControls from './TouchControls'
import { toCannon, toThree } from './scale'

export default class App {
  assembly = null
  camera = null
  clock = new Clock(false)
  controls = []
  renderer = null
  scene = null
  world = null

  constructor (parent) {
    // Additional container to position VRButton on top of canvas
    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'relative'
    parent.appendChild(container)

    this.renderer = new ResponsiveRenderer(container)
    this.renderer.shadowMap.enabled = true
    this.scene = buildScene()
    this._initPancake()

    this.world = new World()
    this.world.gravity.set(0, 0, 0)
    this.world.allowSleep = true

    const vrButton = new VRButton(container, this.renderer)
    vrButton.addEventListener('enter', this._onVRPresent)
    vrButton.addEventListener('exit', this._onVRExit)
  }

  load (assembly) {
    const { camera, scene, renderer, world } = this

    if (this.assembly) this._unload(this.assembly)

    assembly.components.forEach((c) => {
      scene.add(c)
      world.addBody(c.body)
      world.addBody(c.dragBody)

      const constraint = new LockConstraint(
        c.body,
        c.dragBody,
        // TODO: revisit force after revising drag
        { maxForce: 10 },
      )
      world.addConstraint(constraint)

      // Constraint base class wakes up both bodies when instantiated. Its
      // wakeUpBodies option allows this behavior to be disabled but subclass
      // LockConstraint does not pass its options to the parent class.
      c.body.sleep()
      c.body.addEventListener('sleep', this._onBodySleep)
    })

    assembly.fixtures.forEach((f) => {
      scene.add(f)
      world.addBody(f.body)
    })

    // TODO: include these in controls disabled for VR
    // TODO: initialize these and other controls only on start
    this.dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    this.dragControls.addEventListener('dragstart', this._onDragStart)
    this.dragControls.addEventListener('drag', this._onDrag)
    this.dragControls.addEventListener('dragend', this._onDragEnd)
    this.rotateControls = new RotateControls(assembly.components, camera, renderer.domElement)
    this.rotateControls.addEventListener('rotatestart', this._onDragStart)
    this.rotateControls.addEventListener('rotate', this._onRotate)
    this.rotateControls.addEventListener('rotateend', this._onDragEnd)

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

    this.dragControls.removeEventListener('dragstart', this._onDragStart)
    this.dragControls.removeEventListener('drag', this._onDrag)
    this.dragControls.removeEventListener('dragend', this._onDragEnd)
    this.dragControls.deactivate()
    this.rotateControls.removeEventListener('rotatestart', this._onDragStart)
    this.rotateControls.removeEventListener('rotate', this._onRotate)
    this.rotateControls.removeEventListener('rotateend', this._onDragEnd)
    this.rotateControls.deactivate()

    assembly.fixtures.forEach((f) => {
      scene.remove(f)
      world.removeBody(f.body)
    })

    assembly.components.forEach((c) => {
      scene.remove(c)
      c.body.removeEventListener('sleep', this._onBodySleep)
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
        toThree(c.body.position, c.position)
        c.quaternion.copy(c.body.quaternion)
      })
    }
  }

  _render () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }

  _onDragStart = (event) => {
    const component = event.object
    const { body } = component
    body.type = Body.DYNAMIC
    body.allowSleep = false
    body.wakeUp()
    this.dispatchEvent({ type: 'dragstart', component })
  }

  _onDrag = (event) => {
    const component = event.object
    const { dragBody, position } = component
    toCannon(position, dragBody.position)
    component.testLinks()
    this.dispatchEvent({ type: 'drag', component })
  }

  _onDragEnd = (event) => {
    const component = event.object
    const { body } = component
    body.allowSleep = true
  }

  _onBodySleep = (event) => {
    const body = event.target
    body.type = Body.STATIC
    body.component.testLinks()
    // Public event dispatches after body is at rest to avoid confusion with bodies
    this.dispatchEvent({ type: 'dragend', component: body.component })
  }

  _onRotate = (event) => {
    const component = event.object
    const { dragBody, quaternion } = component
    dragBody.quaternion.set(...quaternion.toArray())
    this.dispatchEvent({ type: 'rotate', component })
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
    const camera = new PerspectiveCamera(45, 1, 0.05, 40)
    camera.up.set(0, 0, 1)
    camera.position.set(0, -0.5, 0.5)
    camera.rotation.set(Math.PI / 2, 0, 0)
    const cameraControls = new CameraControls(camera, this.renderer.domElement)
    cameraControls.enablePan = false
    this.scene.userData.floor.visible = false
    this.controls = [cameraControls]
    this.camera = camera
  }

  _initVR () {
    const dolly = new Object3D()
    // TODO: set antialias, setPixelRatio, setSize, userHeight, standingMatrix
    // TODO: events: resize vrdisplaypointerrestricted vrdisplaypointerunrestricted
    // TODO: consider FOV changes
    const camera = new PerspectiveCamera(45, 1, 0.05, 40)
    dolly.up.set(0, 0, 1)
    dolly.position.set(0, -0.5, 0.5)
    dolly.rotation.set(Math.PI / 2, 0, 0)
    dolly.add(camera)

    const [touchL, touchR] = [0, 1].map((index) => {
      const touch = new TouchControls(index, this.assembly.components)
      touch.addEventListener('dragstart', this._onDragStart)
      touch.addEventListener('drag', this._onDrag)
      touch.addEventListener('dragend', this._onDragEnd)
      touch.addEventListener('rotate', this._onRotate)
      dolly.add(touch)
      return touch
    })

    this.scene.add(dolly)
    this.scene.userData.floor.visible = true
    this.controls = [touchL, touchR]
    this.camera = camera
  }
}

Object.assign(App.prototype, EventDispatcher.prototype)
