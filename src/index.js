import * as THREE from 'three'
import DragControls from './DragControls'

class Component {
  clock = new THREE.Clock(false)

  constructor (parent) {
    const canvas = this._createCanvas(parent)
    const renderer = new THREE.WebGLRenderer({ canvas })

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
    const dt = this.clock.getDelta()
    this._update(dt)
    this._render()
  }

  _update (dt) {
    this.target.rotation.z += 1.0 * dt
  }

  _render () {
    this._resize()
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }

  _resize () {
    const { container, renderer, camera } = this
    const width = container.clientWidth
    const height = container.clientHeight
    if (container.width != width || container.height != height) {
      renderer.setSize(container.clientWidth, container.clientHeight, false)

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  _createCanvas (parent) {
    if (!(parent instanceof HTMLElement)) throw 'parent must be HTMLElement'

    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'relative'

    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'

    container.appendChild(canvas)
    parent.appendChild(container)
    this.container = container
    return canvas
  }

  _onDrag = (event) => {
    const target = new THREE.Vector3(0, 0, 1).add(this.target.position)
    const dist = target.sub(event.object.position).length()
    if (dist < 0.05) {
      this.cube.material.color = new THREE.Color(0x00ff00)
    } else {
      this.cube.material.color = new THREE.Color(0xff0000)
    }
  }
}

const parent = document.getElementById('container')
const component = new Component(parent)
component.start()
