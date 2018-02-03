import * as THREE from 'three'
import DragControls from './DragControls'

class Component {
  clock = new THREE.Clock(false)

  constructor () {
    const renderer = new THREE.WebGLRenderer()

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    camera.position.set(0, -10, 0)
    camera.rotation.set(Math.PI / 2, 0, 0)
    scene.add(camera)

    const target = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x808080 })
    )
    scene.add(target)

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    cube.position.set(3, 0, 0)
    scene.add(cube)

    const dragControls = new DragControls([cube], camera, renderer.domElement)

    Object.assign(this, { renderer, scene, camera, cube, target })
  }

  domElement () {
    return this.renderer.domElement
  }

  start () {
    this.clock.start()
    this._animate()
  }

  _animate = () => {
    requestAnimationFrame(this._animate)
    const dt = this.clock.getDelta()
    this._update(dt)
    this._render()
  }

  _update (dt) {
    this.target.rotation.z += 1.0 * dt
  }

  _render () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }
}

const component = new Component()
component.start()
document.body.appendChild(component.domElement())
