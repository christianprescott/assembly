import * as THREE from 'three'

class Component {
  constructor () {
    const renderer = new THREE.WebGLRenderer()

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    scene.add(camera)

    Object.assign(this, { renderer, scene, camera })
  }

  domElement () {
    return this.renderer.domElement
  }

  start () {
    const { renderer, scene, camera } = this
    renderer.render(scene, camera)
  }
}

const component = new Component()
component.start()
document.body.appendChild(component.domElement())
