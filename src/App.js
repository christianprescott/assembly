import { Body, LockConstraint, World } from 'cannon'
import { Clock, EventDispatcher, Object3D, PerspectiveCamera } from 'three'
import VRButton from './VRButton'
import buildScene from './buildScene'
import DragControls from './DragControls'
import CameraControls from './CameraControls'
import ResponsiveRenderer from './ResponsiveRenderer'
import RotateControls from './RotateControls'
import VRControls from './VRControls'
import { toCannon, toThree } from './scale'

export default class App {
  assembly = null
  clock = new Clock(false)
  options = {}
  renderer = null
  scene = null
  world = null

  // Controls state management
  pancakeCamera = new PerspectiveCamera(45, 1, 0.05, 40)
  pancakeControls = []
  vrCamera = new PerspectiveCamera(45, 1, 0.05, 40)
  vrControls = []
  camera = this.pancakeCamera
  controls = this.pancakeControls

  constructor (parent, options = {}) {
    this.options = options

    // Additional container to position VRButton on top of canvas
    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'relative'
    parent.appendChild(container)

    this.renderer = new ResponsiveRenderer(container)
    this.renderer.shadowMap.enabled = true
    this.scene = buildScene()

    this.world = new World()
    this.world.gravity.set(0, 0, 0)
    this.world.allowSleep = true

    // VRButton lives outside this.controls because it is never disposed
    this.vrButton = new VRButton(container, this.renderer)
    this.vrButton.addEventListener('enter', this._onVRPresent)
    this.vrButton.addEventListener('exit', this._onVRExit)
  }

  load (assembly) {
    const { scene, renderer, world } = this

    // enforcing this ensures controls initialized with the new assembly get
    // activated on start - one less state change to manage
    if (this.clock.running) throw new Error('must be stopped before loading new assembly')
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

    this._initPancake({ assembly, renderer, scene }).forEach(c => this.pancakeControls.push(c))
    this._initVR({ assembly, renderer, scene }).forEach(c => this.vrControls.push(c))

    this.assembly = assembly
  }

  start () {
    if (!this.assembly) throw new Error('assembly must be loaded before start')

    this.vrButton.activate()
    this.controls.forEach(c => c.activate())
    this.clock.start()
    this.renderer.animate(this._animate)
  }

  stop () {
    this.renderer.animate(null)
    this.clock.stop()
    this.controls.forEach(c => c.deactivate())
    this.vrButton.deactivate()
  }

  render () {
    this._render()
  }

  fullscreen () {
    this.renderer.fullscreen()
  }

  // private

  _unload (assembly) {
    const { scene, world } = this

    this.pancakeControls.splice(0, this.pancakeControls.length).forEach(c => c.dispose())
    this.vrControls.splice(0, this.pancakeControls.length).forEach(c => c.dispose())

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

  _onVRPresent = () => {
    this.controls.forEach(c => c.deactivate())
    this.controls = this.vrControls
    this.camera = this.vrCamera
    this.controls.forEach(c => c.activate())
    this.scene.userData.floor.visible = true
  }

  _onVRExit = () => {
    this.controls.forEach(c => c.deactivate())
    this.controls = this.pancakeControls
    this.camera = this.pancakeCamera
    this.controls.forEach(c => c.activate())
    this.scene.userData.floor.visible = false
  }

  _initPancake ({ assembly, renderer }) {
    const camera = this.pancakeCamera
    camera.up.set(0, 0, 1)
    camera.position.set(0, -0.5, 0.5)
    camera.rotation.set(Math.PI / 2, 0, 0)
    const cameraControls = new CameraControls(camera, renderer.domElement)
    cameraControls.enablePan = false
    if (this.options.readOnly) return [cameraControls]

    const dragControls = new DragControls(assembly.components, camera, renderer.domElement)
    dragControls.addEventListener('dragstart', this._onDragStart)
    dragControls.addEventListener('drag', this._onDrag)
    dragControls.addEventListener('dragend', this._onDragEnd)
    const rotateControls = new RotateControls(assembly.components, camera, renderer.domElement)
    rotateControls.addEventListener('rotatestart', this._onDragStart)
    rotateControls.addEventListener('rotate', this._onRotate)
    rotateControls.addEventListener('rotateend', this._onDragEnd)

    return [cameraControls, dragControls, rotateControls]
  }

  _initVR ({ assembly, scene }) {
    const dolly = new Object3D()
    // TODO: remove this dolly from the scene when disposed
    scene.add(dolly)

    // TODO: set antialias, setPixelRatio, setSize, userHeight, standingMatrix
    // TODO: events: resize vrdisplaypointerrestricted vrdisplaypointerunrestricted
    // TODO: consider FOV changes
    const camera = this.vrCamera
    dolly.up.set(0, 0, 1)
    dolly.position.set(0, -0.5, 0.5)
    dolly.rotation.set(Math.PI / 2, 0, 0)
    dolly.add(camera)
    if (this.options.readOnly) return []

    const [touchL, touchR] = [0, 1].map((index) => {
      const touch = new VRControls(index, assembly.components)
      touch.addEventListener('dragstart', this._onDragStart)
      touch.addEventListener('drag', this._onDrag)
      touch.addEventListener('dragend', this._onDragEnd)
      touch.addEventListener('rotate', this._onRotate)
      dolly.add(touch)
      return touch
    })

    return [touchL, touchR]
  }
}

Object.assign(App.prototype, EventDispatcher.prototype)
