import * as THREE from 'three'
import DragControls from './DragControls'
import ResponsiveRenderer from './ResponsiveRenderer'

export default class App {
  clock = new THREE.Clock(false)

  constructor (parent) {
    const renderer = new ResponsiveRenderer(parent)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    camera.position.set(0, -10, 0)
    camera.rotation.set(Math.PI / 2, 0, 0)
    scene.add(camera)

    const target = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x808080 }),
    )
    scene.add(target)

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    )
    cube.position.set(3, 0, 0)
    scene.add(cube)

    const dragControls = new DragControls([cube], camera, renderer.domElement)
    dragControls.addEventListener('drag', this._onDrag)

    Object.assign(this, { renderer, scene, camera, cube, target })
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
    const target = new THREE.Vector3(0, 0, 1).add(this.target.position)
    const dist = target.sub(event.object.position).length()
    if (dist < 0.05) {
      this.cube.material.color = new THREE.Color(0x00ff00)
    } else {
      this.cube.material.color = new THREE.Color(0xff0000)
    }
  }
}
